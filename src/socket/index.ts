import { Server as SocketServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { verifyToken } from '../utils/auth.js';
import { UserService } from '../services/userService.js';
import { MessageService } from '../services/messageService.js';

// Store online users with their socket IDs
const onlineUsers = new Map<string, string>(); // userId -> socketId
let ioInstance: SocketServer | null = null;

export function initializeSocket(httpServer: HTTPServer): SocketServer {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  ioInstance = io;

  // Middleware to authenticate socket connections
  io.use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = verifyToken(token);
      (socket as any).userId = decoded.userId;

      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', async (socket: Socket) => {
    const userId = (socket as any).userId;

    console.log(`User connected: ${userId} (Socket: ${socket.id})`);

    // Store user's socket ID
    onlineUsers.set(userId, socket.id);
    
    // Join private room for notifications
    socket.join(`user:${userId}`);

    // Update user's online status in database
    try {
      await UserService.updateOnlineStatus(userId, true);
    } catch (error) {
      console.error('Error updating online status:', error);
    }

    // Broadcast to all users that this user is online
    socket.broadcast.emit('user:online', { userId, isOnline: true });

    // Handle user joining a chat room
    socket.on('chat:join', async (data: { chatId: string }) => {
      try {
        const { chatId } = data;
        socket.join(`chat:${chatId}`);

        // Mark all messages in this chat as delivered
        await MessageService.markMessagesAsDelivered(chatId, userId);
        
        // Notify other users in the chat that their messages were delivered
        socket.to(`chat:${chatId}`).emit('message:status-updated', {
          chatId,
          userId,
          status: 'delivered'
        });

        console.log(`User ${userId} joined chat ${chatId}`);
      } catch (error) {
        console.error('Error joining chat:', error);
      }
    });

    // Handle user leaving a chat room
    socket.on('chat:leave', (data: { chatId: string }) => {
      const { chatId } = data;
      socket.leave(`chat:${chatId}`);
      console.log(`User ${userId} left chat ${chatId}`);
    });

    // Handle new message
    socket.on('message:send', async (data: { chatId: string; content: string }) => {
      try {
        const { chatId, content } = data;

        // Send message via service
        const message = await MessageService.sendMessage(chatId, userId, content);

        if ('error' in message) {
          socket.emit('message:error', { error: message.error });
          return;
        }

        // Get sender info
        const sender = await UserService.getUserById(userId);
        const senderData = sender && !('error' in sender) ? sender : null;

        // Prepare message data with sender info
        const messageData = {
          id: message.id,
          chat_id: message.chat_id,
          sender_id: message.sender_id,
          content: message.content,
          status: message.status,
          created_at: message.created_at,
          sender_name: senderData?.username,
          sender_avatar: senderData?.avatar,
        };

        // Emit to all users in the chat room (including sender)
        io.to(`chat:${chatId}`).emit('message:new', messageData);

        // Also emit to all members' private rooms for notifications
        const members = await MessageService.getChatMembers(chatId);
        if (Array.isArray(members)) {
          members.forEach(memberId => {
            if (memberId !== userId) {
              io.to(`user:${memberId}`).emit('message:new', messageData);
            }
          });
        }

        console.log(`Message sent in chat ${chatId} by user ${userId}`);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('message:error', { error: 'Failed to send message' });
      }
    });

    // Handle message status update (delivered/read)
    socket.on(
      'message:status',
      async (data: { chatId: string; messageIds: string[]; status: 'delivered' | 'read' }) => {
        try {
          const { chatId, messageIds, status } = data;

          await MessageService.updateMessageStatus(messageIds, userId, status);

          // Broadcast status update to chat members specifically
          if (chatId) {
            socket.to(`chat:${chatId}`).emit('message:status-updated', {
              chatId,
              messageIds,
              status,
              userId,
            });
          } else {
            // Fallback for global broadcast if chatId not provided
            socket.broadcast.emit('message:status-updated', {
              messageIds,
              status,
              userId,
            });
          }

          console.log(`Message status updated to ${status} by user ${userId}`);
        } catch (error) {
          console.error('Error updating message status:', error);
        }
      }
    );

    // Handle marking all messages as read in a chat
    socket.on('message:read-all', async (data: { chatId: string }) => {
      try {
        const { chatId } = data;

        await MessageService.markMessagesAsRead(chatId, userId);

        // Notify other users in the chat
        socket.to(`chat:${chatId}`).emit('message:all-read', {
          chatId,
          userId,
        });

        console.log(`All messages marked as read in chat ${chatId} by user ${userId}`);
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // Handle typing indicator
    socket.on('typing:start', (data: { chatId: string }) => {
      const { chatId } = data;
      socket.to(`chat:${chatId}`).emit('typing:user-typing', {
        userId,
        chatId,
      });
    });

    socket.on('typing:stop', (data: { chatId: string }) => {
      const { chatId } = data;
      socket.to(`chat:${chatId}`).emit('typing:user-stopped', {
        userId,
        chatId,
      });
    });

    // Handle new invitation
    socket.on('invitation:new', (data: { inviteeId: string; invitation: any }) => {
      const { inviteeId, invitation } = data;
      const inviteeSocketId = onlineUsers.get(inviteeId);

      if (inviteeSocketId) {
        io.to(inviteeSocketId).emit('invitation:received', invitation);
      }
    });

    // Handle invitation response
    socket.on(
      'invitation:respond',
      (data: { inviterId: string; chatId: string; accepted: boolean }) => {
        const { inviterId, chatId, accepted } = data;
        const inviterSocketId = onlineUsers.get(inviterId);

        if (inviterSocketId) {
          io.to(inviterSocketId).emit('invitation:responded', {
            userId,
            chatId,
            accepted,
          });
        }
      }
    );

    // Handle user disconnection
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${userId} (Socket: ${socket.id})`);

      // Remove user from online users
      onlineUsers.delete(userId);

      // Update user's online status in database
      try {
        await UserService.updateOnlineStatus(userId, false);
      } catch (error) {
        console.error('Error updating offline status:', error);
      }

      // Broadcast to all users that this user is offline
      socket.broadcast.emit('user:online', { userId, isOnline: false });
    });
  });

  return io;
}

// Helper function to get online users
export function getOnlineUsers(): Map<string, string> {
  return onlineUsers;
}

// Helper function to get IO instance
export function getIO(): SocketServer {
  if (!ioInstance) {
    throw new Error('Socket.io not initialized');
  }
  return ioInstance;
}

// Helper function to emit to specific user
export function emitToUser(userId: string, event: string, data: any): void {
  if (!ioInstance) return;
  const socketId = onlineUsers.get(userId);
  if (socketId) {
    ioInstance.to(socketId).emit(event, data);
  }
}
