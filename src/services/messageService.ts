import db from '../config/database.js';
import { Message, MessageStatus } from '../types/index.js';

export class MessageService {
  // Send message
  static async sendMessage(
    chatId: string,
    senderId: string,
    content: string,
    replyTo?: string
  ): Promise<Message | { error: string }> {
    try {
      // Check if sender is a member of the chat
      const membership = await db('chat_members')
        .where({ chat_id: chatId, user_id: senderId })
        .first();

      if (!membership) {
        return { error: 'You are not a member of this chat' };
      }

      // Create message
      const [message] = await db('messages')
        .insert({
          chat_id: chatId,
          sender_id: senderId,
          content,
          reply_to: replyTo || null,
          status: MessageStatus.SENT,
        })
        .returning('*');

      // Update chat's updated_at
      await db('chats').where({ id: chatId }).update({ updated_at: new Date() });

      return message;
    } catch (error: any) {
      return { error: error.message };
    }
  }

  // Get messages for a chat
  static async getChatMessages(
    chatId: string,
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<any[] | { error: string }> {
    try {
      // Check if user is a member
      const membership = await db('chat_members')
        .where({ chat_id: chatId, user_id: userId })
        .first();

      if (!membership) {
        return { error: 'You are not a member of this chat' };
      }

      const messages = await db('messages')
        .select(
          'messages.id',
          'messages.chat_id',
          'messages.sender_id',
          'messages.content',
          'messages.status',
          'messages.created_at',
          'messages.reply_to',
          'users.username as sender_name',
          'users.avatar as sender_avatar',
          'parent.content as reply_content',
          'parent_user.username as reply_user'
        )
        .join('users', 'messages.sender_id', 'users.id')
        .leftJoin('messages as parent', 'messages.reply_to', 'parent.id')
        .leftJoin('users as parent_user', 'parent.sender_id', 'parent_user.id')
        .where('messages.chat_id', chatId)
        .orderBy('messages.created_at', 'desc')
        .limit(limit)
        .offset(offset);

      return messages.reverse(); // Return in chronological order
    } catch (error: any) {
      return { error: error.message };
    }
  }

  // Get chat members
  static async getChatMembers(chatId: string): Promise<string[] | { error: string }> {
    try {
      const members = await db('chat_members')
        .select('user_id')
        .where({ chat_id: chatId });

      return members.map(m => m.user_id);
    } catch (error: any) {
      return { error: error.message };
    }
  }

  // Update message status (delivered/read)
  static async updateMessageStatus(
    messageIds: string[],
    userId: string,
    status: 'delivered' | 'read'
  ): Promise<void | { success: boolean } | { error: string }> {
    try {
      // Only update messages that are not sent by the user
      await db('messages')
        .whereIn('id', messageIds)
        .whereNot('sender_id', userId)
        .update({ status, updated_at: new Date() });
      return { success: true };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  // Mark all messages as delivered for a user
  static async markMessagesAsDelivered(
    chatId: string,
    userId: string
  ): Promise<void | { success: boolean } | { error: string }> {
    try {
      await db('messages')
        .where({ chat_id: chatId, status: MessageStatus.SENT })
        .whereNot('sender_id', userId)
        .update({ status: MessageStatus.DELIVERED, updated_at: new Date() });
      return { success: true };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  // Mark all messages as read for a user
  static async markMessagesAsRead(
    chatId: string,
    userId: string
  ): Promise<void | { success: boolean } | { error: string }> {
    try {
      await db('messages')
        .where({ chat_id: chatId })
        .whereIn('status', [MessageStatus.SENT, MessageStatus.DELIVERED])
        .whereNot('sender_id', userId)
        .update({ status: MessageStatus.READ, updated_at: new Date() });
      return { success: true };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  // Update message
  static async updateMessage(messageId: string, userId: string, content: string): Promise<any | { error: string }> {
    try {
      const message = await db('messages').where({ id: messageId }).first();
      if (!message) return { error: 'Message not found' };
      if (message.sender_id !== userId) return { error: 'Unauthorized' };

      const [updatedMessage] = await db('messages')
        .where({ id: messageId })
        .update({ content, updated_at: new Date() })
        .returning('*');
      
      return updatedMessage;
    } catch (error: any) {
      return { error: error.message };
    }
  }

  // Delete message
  static async deleteMessage(messageId: string, userId: string): Promise<void | { success: boolean } | { error: string }> {
    try {
      const message = await db('messages').where({ id: messageId }).first();
      if (!message) return { error: 'Message not found' };
      if (message.sender_id !== userId) return { error: 'Unauthorized' };

      await db('messages').where({ id: messageId }).del();
      return { success: true };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  // Get shared files for a chat
  static async getSharedFiles(chatId: string): Promise<any[] | { error: string }> {
    try {
      const messages = await db('messages')
        .where({ chat_id: chatId })
        .whereILike('content', 'http%') // Simple check for URLs
        .andWhere(function() {
          this.whereILike('content', '%.pdf')
            .orWhereILike('content', '%.png')
            .orWhereILike('content', '%.jpg')
            .orWhereILike('content', '%.jpeg')
            .orWhereILike('content', '%.doc')
            .orWhereILike('content', '%.docx')
            .orWhereILike('content', '%.zip');
        })
        .orderBy('created_at', 'desc');

      return messages.map(m => ({
        id: m.id,
        name: m.content.split('/').pop() || 'file',
        url: m.content,
        date: m.created_at,
        size: '2.4 MB' // Mock size for now as we don't store it in messages
      }));
    } catch (error: any) {
      return { error: error.message };
    }
  }
}
