import { Response } from 'express';
import { MessageService } from '../services/messageService.js';
import { UserService } from '../services/userService.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthRequest } from '../middlewares/auth.js';
import { MessageStatus } from '../types/index.js';
import { getIO } from '../socket/index.js';
import db from '../config/database.js';

export class MessageController {
  // Send message
  static async sendMessage(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { chat_id, content, reply_to } = req.body;
      const userId = req.user!.userId;
      console.log('Sending message:', { chat_id, content, reply_to });
      const result = await MessageService.sendMessage(chat_id, userId, content, reply_to);
      if ('error' in result) {
        console.error('MessageService error:', result.error);
        return sendError(res, 400, result.error);
      }
      const message = result as any;
      console.log('Message created successfully:', message.id);

      const members = await MessageService.getChatMembers(chat_id);
      if (!Array.isArray(members)) return sendError(res, 400, members.error);
      const otherMembers = members.filter(id => id !== userId);

      const { getOnlineUsers } = await import('../socket/index.js');
      const onlineUsersMap = getOnlineUsers();

      const isAnyOtherOnline = otherMembers.some(memberId => onlineUsersMap.has(memberId));

      if (isAnyOtherOnline) {
        const updateRes = await MessageService.updateMessageStatus([message.id], userId, MessageStatus.DELIVERED);
        if (updateRes && 'error' in updateRes) console.error(updateRes.error);
        message.status = MessageStatus.DELIVERED;
      }

      const sender = await UserService.getUserById(userId);
      if (sender && 'error' in sender) return sendError(res, 404, sender.error);

      const messageData = {
        id: message.id,
        chat_id: message.chat_id,
        sender_id: message.sender_id,
        content: message.content,
        status: message.status,
        created_at: message.created_at,
        reply_to: message.reply_to,
        sender_name: sender?.username,
        sender_avatar: sender?.avatar,
      } as any;

      // If it's a reply, get parent info for the socket event
      if (message.reply_to) {
        try {
          console.log('Fetching parent message:', message.reply_to);
          const parent = await db('messages').where({ id: message.reply_to }).first();
          if (parent) {
            const parentUser = await db('users').where({ id: parent.sender_id }).first();
            messageData.reply_content = parent.content;
            messageData.reply_user = parentUser?.username;
            console.log('Parent info found:', { reply_user: messageData.reply_user });
          }
        } catch (parentErr) {
          console.error('Error fetching parent message info:', parentErr);
          // Don't fail the whole request just because parent info fetch failed
        }
      }

      try {
        const io = getIO();
        io.to(`chat:${chat_id}`).emit('message:new', messageData);

        const allMembers = await MessageService.getChatMembers(chat_id);
        if (Array.isArray(allMembers)) {
          allMembers.forEach(memberId => {
            if (memberId !== userId) {
              io.to(`user:${memberId}`).emit('message:new', messageData);
            }
          });
        }
      } catch (socketError) {
        console.error('Socket broadcast error:', socketError);
      }

      return sendSuccess(res, 201, 'Message sent successfully', message);
    } catch (error: any) {
      console.error('Final sendMessage Error:', error);
      return sendError(res, 400, error.message);
    }
  }

  // Get chat messages
  static async getChatMessages(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { chatId } = req.params;
      const userId = req.user!.userId;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const messages = await MessageService.getChatMessages(chatId, userId, limit, offset);
      if (!Array.isArray(messages)) return sendError(res, 404, messages.error);

      return sendSuccess(res, 200, 'Messages fetched successfully', messages);
    } catch (error: any) {
      return sendError(res, 404, error.message);
    }
  }

  // Update message status
  static async updateMessageStatus(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { message_ids, status, chat_id } = req.body;
      const userId = req.user!.userId;

      const result = await MessageService.updateMessageStatus(message_ids, userId, status);
      if (result && 'error' in result) return sendError(res, 400, result.error);

      try {
        const io = getIO();
        if (chat_id) {
          io.to(`chat:${chat_id}`).emit('message:status-updated', {
            chatId: chat_id,
            messageIds: message_ids,
            status,
            userId,
          });
        } else {
          io.emit('message:status-updated', {
            messageIds: message_ids,
            status,
            userId,
          });
        }
      } catch (socketError) {
        console.error('Socket broadcast error:', socketError);
      }

      return sendSuccess(res, 200, 'Message status updated successfully');
    } catch (error: any) {
      return sendError(res, 400, error.message);
    }
  }

  // Mark messages as read
  static async markAsRead(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { chatId } = req.params;
      const userId = req.user!.userId;

      const result = await MessageService.markMessagesAsRead(chatId, userId);
      if (result && 'error' in result) return sendError(res, 400, result.error);

      try {
        const io = getIO();
        io.to(`chat:${chatId}`).emit('message:all-read', {
          chatId,
          userId,
        });
      } catch (socketError) {
        console.error('Socket broadcast error:', socketError);
      }

      return sendSuccess(res, 200, 'Messages marked as read');
    } catch (error: any) {
      return sendError(res, 400, error.message);
    }
  }

  // Upload file
  static async uploadFile(req: AuthRequest, res: Response): Promise<Response> {
    try {
      if (!req.file) {
        return sendError(res, 400, 'No file uploaded');
      }

      const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

      return sendSuccess(res, 200, 'File uploaded successfully', {
        url: fileUrl,
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });
    } catch (error: any) {
      return sendError(res, 500, error.message);
    }
  }

  // Update message
  static async updateMessage(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { content } = req.body;
      const userId = req.user!.userId;

      const message = await MessageService.updateMessage(id, userId, content);
      if (message && 'error' in message) return sendError(res, 400, message.error);

      try {
        const io = getIO();
        io.to(`chat:${message.chat_id}`).emit('message:updated', message);
      } catch (e) {}

      return sendSuccess(res, 200, 'Message updated successfully', message);
    } catch (error: any) {
      return sendError(res, 400, error.message);
    }
  }

  // Delete message
  static async deleteMessage(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const message = await db('messages').where({ id }).first();
      if (!message) {
        return sendError(res, 404, 'Message not found');
      }

      const result = await MessageService.deleteMessage(id, userId);
      if (result && 'error' in result) return sendError(res, 400, result.error);

      try {
        const io = getIO();
        io.to(`chat:${message.chat_id}`).emit('message:deleted', { messageId: id, chatId: message.chat_id });
      } catch (e) {}

      return sendSuccess(res, 200, 'Message deleted successfully');
    } catch (error: any) {
      return sendError(res, 400, error.message);
    }
  }

  // Get shared files
  static async getSharedFiles(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { chatId } = req.params;
      const files = await MessageService.getSharedFiles(chatId);
      if (!Array.isArray(files)) return sendError(res, 400, files.error);

      return sendSuccess(res, 200, 'Shared files fetched successfully', files);
    } catch (error: any) {
      return sendError(res, 400, error.message);
    }
  }
}