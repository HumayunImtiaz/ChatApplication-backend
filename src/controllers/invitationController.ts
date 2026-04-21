import { Response } from 'express';
import { InvitationService } from '../services/invitationService.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthRequest } from '../middlewares/auth.js';
import { getIO } from '../socket/index.js';
import { ChatService } from '../services/chatService.js';

export class InvitationController {
  // Get user's invitations
  static async getUserInvitations(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user!.userId;

      const invitations = await InvitationService.getUserInvitations(userId);
      if (!Array.isArray(invitations)) return sendError(res, 400, invitations.error);

      return sendSuccess(res, 200, 'Invitations fetched successfully', invitations);
    } catch (error: any) {
      return sendError(res, 500, error.message);
    }
  }

  // Respond to invitation (accept/reject)
  static async respondToInvitation(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { invitation_id, accept } = req.body;
      const userId = req.user!.userId;

      if (accept) {
        const result = await InvitationService.acceptInvitation(invitation_id, userId);
        
        if (result && typeof result === 'object' && 'error' in result) {
          return sendError(res, 400, result.error);
        }

        const invitation = (result as any).invitation;

        // Notify both users via socket to refresh their chat lists
        try {
          if (invitation) {
            const io = getIO();
            const inviterId = invitation.inviter_id;
            
            // Get chat details to send
            const chat = await ChatService.getChatById(invitation.chat_id, userId);
            const inviterChat = await ChatService.getChatById(invitation.chat_id, inviterId);

            if (chat && !('error' in chat)) {
              io.to(`user:${userId}`).emit('chat:new', chat);
            }
            if (inviterChat && !('error' in inviterChat)) {
              io.to(`user:${inviterId}`).emit('chat:new', inviterChat);
            }
            
            // Also notify that invitation was responded to
            io.to(`user:${inviterId}`).emit('invitation:responded', {
              invitationId: invitation_id,
              status: 'accepted'
            });
          }
        } catch (socketError) {
          console.error('Socket notification error:', socketError);
        }

        return sendSuccess(res, 200, 'Invitation accepted successfully');
      } else {
        const result = await InvitationService.rejectInvitation(invitation_id, userId);
        if (result && typeof result === 'object' && 'error' in result) return sendError(res, 400, result.error);
        return sendSuccess(res, 200, 'Invitation rejected successfully');
      }
    } catch (error: any) {
      return sendError(res, 400, error.message);
    }
  }
}