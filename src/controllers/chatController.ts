import { Response } from 'express';
import { ChatService } from '../services/chatService.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthRequest } from '../middlewares/auth.js';
import { getIO } from '../socket/index.js';
import { InvitationService } from '../services/invitationService.js';

export class ChatController {
  // Create direct chat
  static async createDirectChat(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { invitee_id } = req.body;
      const userId = req.user!.userId;

      if (invitee_id === userId) {
        return sendError(res, 400, 'Cannot create chat with yourself');
      }

      const result = await ChatService.createDirectChat(userId, invitee_id);
      if (result && 'error' in result) return sendError(res, 400, result.error);

      // Notify invitee via socket
      try {
        const io = getIO();
        const invitation = await InvitationService.getUserInvitations(invitee_id);
        if (Array.isArray(invitation)) {
          const newInvitation = invitation.find(inv => inv.id === (result as any).invitationId);
          if (newInvitation) {
            io.to(`user:${invitee_id}`).emit('invitation:received', newInvitation);
          }
        }
      } catch (socketError) {
        console.error('Socket notification error:', socketError);
      }

      return sendSuccess(res, 201, 'Direct chat invitation sent successfully', result);
    } catch (error: any) {
      return sendError(res, 400, error.message);
    }
  }

  // Create group chat
  static async createGroupChat(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { name, member_ids, avatar } = req.body;
      const userId = req.user!.userId;

      const result = await ChatService.createGroupChat(userId, name, member_ids, avatar);
      if (result && 'error' in result) return sendError(res, 400, result.error);

      return sendSuccess(res, 201, 'Group chat created successfully', result);
    } catch (error: any) {
      return sendError(res, 400, error.message);
    }
  }

  // Get user's chats
  static async getUserChats(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user!.userId;

      const chats = await ChatService.getUserChats(userId);
      if (!Array.isArray(chats)) return sendError(res, 400, chats.error);

      return sendSuccess(res, 200, 'Chats fetched successfully', chats);
    } catch (error: any) {
      return sendError(res, 500, error.message);
    }
  }

  // Get chat by ID
  static async getChatById(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { chatId } = req.params;
      const userId = req.user!.userId;

      const chat = await ChatService.getChatById(chatId, userId);
      if (chat && 'error' in chat) return sendError(res, 404, chat.error);

      return sendSuccess(res, 200, 'Chat fetched successfully', chat);
    } catch (error: any) {
      return sendError(res, 404, error.message);
    }
  }

  // Invite to group
  static async inviteToGroup(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { chat_id, invitee_id } = req.body;
      const userId = req.user!.userId;

      const result = await ChatService.inviteToGroup(chat_id, userId, invitee_id);
      if (result && typeof result === 'object' && 'error' in result) return sendError(res, 400, result.error);

      // Notify invitee via socket
      try {
        const io = getIO();
        const invitation = await InvitationService.getUserInvitations(invitee_id);
        if (Array.isArray(invitation)) {
          const newInvitation = invitation.find(inv => inv.id === result);
          if (newInvitation) {
            io.to(`user:${invitee_id}`).emit('invitation:received', newInvitation);
          }
        }
      } catch (socketError) {
        console.error('Socket notification error:', socketError);
      }

      return sendSuccess(res, 201, 'Invitation sent successfully', { invitationId: result });
    } catch (error: any) {
      return sendError(res, 400, error.message);
    }
  }

  // Leave chat
  static async leaveChat(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { chatId } = req.params;
      const userId = req.user!.userId;

      const result = await ChatService.leaveChat(chatId, userId);
      if (result && typeof result === 'object' && 'error' in result) return sendError(res, 400, result.error);

      return sendSuccess(res, 200, 'Left chat successfully');
    } catch (error: any) {
      return sendError(res, 400, error.message);
    }
  }
}