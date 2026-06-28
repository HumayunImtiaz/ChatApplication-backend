import db from '../config/database.js';
import { Chat, ChatType, MemberRole } from '../types/index.js';

export class ChatService {
  // Create direct chat (one-to-one)
  static async createDirectChat(
    creatorId: string,
    inviteeId: string
  ): Promise<{ chatId: string; invitationId: string } | { error: string }> {
    try {
      // Check if direct chat already exists between these users
      const existingChat = await db('chats')
        .select('chats.id')
        .join('chat_members as cm1', 'chats.id', 'cm1.chat_id')
        .join('chat_members as cm2', 'chats.id', 'cm2.chat_id')
        .where('chats.type', ChatType.DIRECT)
        .where('cm1.user_id', creatorId)
        .where('cm2.user_id', inviteeId)
        .first();

      if (existingChat) {
        return { error: 'Direct chat already exists with this user' };
      }

      // Check if there is already a pending invitation
      const existingInvitation = await db('invitations')
        .where({
          inviter_id: creatorId,
          invitee_id: inviteeId,
          status: 'pending'
        })
        .orWhere({
          inviter_id: inviteeId,
          invitee_id: creatorId,
          status: 'pending'
        })
        .first();

      if (existingInvitation) {
        return { error: 'Invitation already sent to this user' };
      }

      // Create chat
      const [chat] = await db('chats')
        .insert({
          type: ChatType.DIRECT,
          created_by: creatorId,
        })
        .returning('id');

      // Add creator as member
      await db('chat_members').insert({
        chat_id: chat.id,
        user_id: creatorId,
        role: MemberRole.MEMBER,
      });

      // Create invitation for invitee
      const [invitation] = await db('invitations')
        .insert({
          chat_id: chat.id,
          inviter_id: creatorId,
          invitee_id: inviteeId,
          status: 'pending',
        })
        .returning('id');

      return { chatId: chat.id, invitationId: invitation.id };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  // Create group chat
  static async createGroupChat(
    creatorId: string,
    name: string,
    memberIds?: string[],
    avatar?: string
  ): Promise<{ chatId: string; invitationIds: string[] } | { error: string }> {
    try {
      // Create chat
      const [chat] = await db('chats')
        .insert({
          name,
          avatar,
          type: ChatType.GROUP,
          created_by: creatorId,
        })
        .returning('id');

      // Add creator as admin
      await db('chat_members').insert({
        chat_id: chat.id,
        user_id: creatorId,
        role: MemberRole.ADMIN,
      });

      // Create invitations for members
      const invitationIds: string[] = [];
      if (memberIds && memberIds.length > 0) {
        const invitations = memberIds.map((memberId) => ({
          chat_id: chat.id,
          inviter_id: creatorId,
          invitee_id: memberId,
          status: 'pending',
        }));

        const createdInvitations = await db('invitations')
          .insert(invitations)
          .returning('id');

        invitationIds.push(...createdInvitations.map((inv) => inv.id));
      }

      return { chatId: chat.id, invitationIds };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  // Update group chat name/avatar
  static async updateGroupChat(
    chatId: string,
    userId: string,
    data: { name?: string; avatar?: string }
  ): Promise<{ success: boolean; chat?: any } | { error: string }> {
    try {
      // Check if user is admin
      const membership = await db('chat_members')
        .where({ chat_id: chatId, user_id: userId })
        .first();

      if (!membership || membership.role !== MemberRole.ADMIN) {
        return { error: 'Only admins can update the group profile' };
      }

      // Check if chat is a group
      const chat = await db('chats').where({ id: chatId }).first();
      if (!chat || chat.type !== ChatType.GROUP) {
        return { error: 'Can only update group chats' };
      }

      const updateData: any = { updated_at: new Date() };
      if (data.name !== undefined) updateData.name = data.name;
      if (data.avatar !== undefined) updateData.avatar = data.avatar;

      if (Object.keys(updateData).length > 1) {
         const [updatedChat] = await db('chats')
          .where({ id: chatId })
          .update(updateData)
          .returning('*');

         return { success: true, chat: updatedChat };
      }
      
      return { success: true, chat };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  // Get user's chats
  static async getUserChats(userId: string): Promise<any[] | { error: string }> {
    try {
      const chats = await db('chats')
        .select(
          'chats.id',
          'chats.name',
          'chats.avatar',
          'chats.type',
          'chats.created_at',
          db.raw(`
            (SELECT json_agg(json_build_object(
              'id', u.id,
              'username', u.username,
              'avatar', u.avatar,
              'is_online', u.is_online
            ))
            FROM (
              SELECT user_id as member_id FROM chat_members WHERE chat_id = chats.id
              UNION
              SELECT invitee_id as member_id FROM invitations WHERE chat_id = chats.id AND status = 'pending'
            ) m
            JOIN users u ON m.member_id = u.id
            ) as members
          `),
          db.raw(`
            (SELECT json_build_object(
              'id', m.id,
              'content', m.content,
              'sender_id', m.sender_id,
              'status', m.status,
              'created_at', m.created_at
            )
            FROM messages m
            WHERE m.chat_id = chats.id
            ORDER BY m.created_at DESC
            LIMIT 1
            ) as last_message
          `)
        )
        .join('chat_members', 'chats.id', 'chat_members.chat_id')
        .where('chat_members.user_id', userId)
        .orderBy('chats.updated_at', 'desc');

      return chats;
    } catch (error: any) {
      return { error: error.message };
    }
  }

  // Get chat by ID with members
  static async getChatById(chatId: string, userId: string): Promise<any | { error: string }> {
    try {
      // Check if user is a member
      const membership = await db('chat_members')
        .where({ chat_id: chatId, user_id: userId })
        .first();

      if (!membership) {
        return { error: 'You are not a member of this chat' };
      }

      const chat = await db('chats')
        .select(
          'chats.id',
          'chats.name',
          'chats.avatar',
          'chats.type',
          'chats.created_at',
          db.raw(`
            (SELECT json_agg(json_build_object(
              'id', u.id,
              'username', u.username,
              'avatar', u.avatar,
              'is_online', u.is_online,
              'role', COALESCE(m.role, 'pending')
            ))
            FROM (
              SELECT user_id as member_id, role FROM chat_members WHERE chat_id = chats.id
              UNION
              SELECT invitee_id as member_id, 'pending' as role FROM invitations WHERE chat_id = chats.id AND status = 'pending'
            ) m
            JOIN users u ON m.member_id = u.id
            ) as members
          `)
        )
        .where('chats.id', chatId)
        .first();

      return chat;
    } catch (error: any) {
      return { error: error.message };
    }
  }

  // Invite user to group
  static async inviteToGroup(
    chatId: string,
    inviterId: string,
    inviteeId: string
  ): Promise<string | { error: string }> {
    try {
      // Check if inviter is admin
      const membership = await db('chat_members')
        .where({ chat_id: chatId, user_id: inviterId })
        .first();

      if (!membership || membership.role !== MemberRole.ADMIN) {
        return { error: 'Only admins can invite members' };
      }

      // Check if chat is a group
      const chat = await db('chats').where({ id: chatId }).first();
      if (chat.type !== ChatType.GROUP) {
        return { error: 'Can only invite to group chats' };
      }

      // Check if already a member
      const existingMember = await db('chat_members')
        .where({ chat_id: chatId, user_id: inviteeId })
        .first();

      if (existingMember) {
        return { error: 'User is already a member' };
      }

      // Check for existing pending invitation
      const existingInvitation = await db('invitations')
        .where({ chat_id: chatId, invitee_id: inviteeId, status: 'pending' })
        .first();

      if (existingInvitation) {
        return { error: 'Invitation already sent' };
      }

      // Create invitation
      const [invitation] = await db('invitations')
        .insert({
          chat_id: chatId,
          inviter_id: inviterId,
          invitee_id: inviteeId,
          status: 'pending',
        })
        .returning('id');

      return invitation.id;
    } catch (error: any) {
      return { error: error.message };
    }
  }

  // Leave or delete chat (removes member)
  static async leaveChat(chatId: string, userId: string): Promise<void | { success: boolean } | { error: string }> {
    try {
      await db('chat_members')
        .where({ chat_id: chatId, user_id: userId })
        .del();

      // Check if any members are left
      const remainingMembers = await db('chat_members').where({ chat_id: chatId }).count('user_id as count').first();
      if (remainingMembers && parseInt(remainingMembers.count as string) === 0) {
        // If no members left, delete messages and the chat itself
        await db('messages').where({ chat_id: chatId }).del();
        await db('chats').where({ id: chatId }).del();
      }
      return { success: true };
    } catch (error: any) {
      return { error: error.message };
    }
  }
}
