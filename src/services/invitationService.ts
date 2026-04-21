import db from '../config/database.js';
import { Invitation, InvitationStatus, MemberRole } from '../types/index.js';

export class InvitationService {
  // Get user's pending invitations
  static async getUserInvitations(userId: string): Promise<any[] | { error: string }> {
    try {
      const invitations = await db('invitations')
        .select(
          'invitations.id',
          'invitations.chat_id',
          'invitations.status',
          'invitations.created_at',
          'chats.name as chat_name',
          'chats.type as chat_type',
          'inviter.id as inviter_id',
          'inviter.username as inviter_username',
          'inviter.avatar as inviter_avatar'
        )
        .join('chats', 'invitations.chat_id', 'chats.id')
        .join('users as inviter', 'invitations.inviter_id', 'inviter.id')
        .where('invitations.invitee_id', userId)
        .where('invitations.status', InvitationStatus.PENDING)
        .orderBy('invitations.created_at', 'desc');

      return invitations;
    } catch (error: any) {
      return { error: error.message };
    }
  }

  // Accept invitation
  static async acceptInvitation(
    invitationId: string,
    userId: string
  ): Promise<void | { success: boolean; invitation?: any } | { error: string }> {
    try {
      // Get invitation
      const invitation = await db('invitations')
        .where({ id: invitationId, invitee_id: userId })
        .first();

      if (!invitation) {
        return { error: 'Invitation not found' };
      }

      if (invitation.status !== InvitationStatus.PENDING) {
        return { error: 'Invitation is not pending' };
      }

      // Check if user is already a member
      const existingMember = await db('chat_members')
        .where({ chat_id: invitation.chat_id, user_id: userId })
        .first();

      if (existingMember) {
        // Just update invitation status and return
        await db('invitations')
          .where({ id: invitationId })
          .update({ status: InvitationStatus.ACCEPTED, updated_at: new Date() });
        return { success: true, invitation };
      }

      // Start transaction
      await db.transaction(async (trx) => {
        // Update invitation status
        await trx('invitations')
          .where({ id: invitationId })
          .update({ status: InvitationStatus.ACCEPTED, updated_at: new Date() });

        // Add user as member
        await trx('chat_members').insert({
          chat_id: invitation.chat_id,
          user_id: userId,
          role: MemberRole.MEMBER,
        });
      });
      return { success: true, invitation };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  // Reject invitation
  static async rejectInvitation(
    invitationId: string,
    userId: string
  ): Promise<void | { success: boolean } | { error: string }> {
    try {
      const invitation = await db('invitations')
        .where({ id: invitationId, invitee_id: userId })
        .first();

      if (!invitation) {
        return { error: 'Invitation not found' };
      }

      if (invitation.status !== InvitationStatus.PENDING) {
        return { error: 'Invitation is not pending' };
      }

      // Update invitation status
      await db('invitations')
        .where({ id: invitationId })
        .update({ status: InvitationStatus.REJECTED, updated_at: new Date() });
      return { success: true };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  // Get invitation by ID
  static async getInvitationById(invitationId: string): Promise<Invitation | { error: string }> {
    try {
      const invitation = await db('invitations').where({ id: invitationId }).first();
      return invitation;
    } catch (error: any) {
      return { error: error.message };
    }
  }
}
