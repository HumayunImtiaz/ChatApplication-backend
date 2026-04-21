import db from '../config/database.js';
import { User, UserResponse } from '../types/index.js';
import { hashPassword, comparePassword, generateToken } from '../utils/auth.js';

export class UserService {
  // Register new user
  static async register(
    username: string,
    email: string,
    password: string,
    avatar?: string
  ): Promise<{ user: UserResponse; token: string } | { error: string }> {
    try {
      // Check if user already exists
      const existingUser = await db('users')
        .where({ email })
        .orWhere({ username })
        .first();

      if (existingUser) {
        return { error: 'User with this email or username already exists' };
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Insert user
      const [user] = await db('users')
        .insert({
          username,
          email,
          password: hashedPassword,
          avatar,
          is_online: false,
        })
        .returning(['id', 'username', 'email', 'avatar', 'is_online', 'created_at']);

      // Generate token
      const token = generateToken({ userId: user.id, email: user.email });

      return { user, token };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  // Login user
  static async login(
    email: string,
    password: string
  ): Promise<{ user: UserResponse; token: string } | { error: string }> {
    try {
      // Find user
      const user = await db('users').where({ email }).first();

      if (!user) {
        return { error: 'Invalid email or password' };
      }

      // Verify password
      const isPasswordValid = await comparePassword(password, user.password);

      if (!isPasswordValid) {
        return { error: 'Invalid email or password' };
      }

      // Update online status
      await db('users').where({ id: user.id }).update({ is_online: true });

      // Generate token
      const token = generateToken({ userId: user.id, email: user.email });

      const { password: _, ...userWithoutPassword } = user;

      return { user: { ...userWithoutPassword, is_online: true }, token };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  // Get user by ID
  static async getUserById(userId: string): Promise<UserResponse | null | { error: string }> {
    try {
      const user = await db('users')
        .select('id', 'username', 'email', 'avatar', 'is_online', 'last_seen', 'created_at')
        .where({ id: userId })
        .first();

      return user || null;
    } catch (error: any) {
      return { error: error.message };
    }
  }

  // Search users
  static async searchUsers(query: string, currentUserId: string): Promise<UserResponse[] | { error: string }> {
    try {
      const users = await db('users')
        .select('id', 'username', 'email', 'avatar', 'is_online', 'last_seen', 'created_at')
        .where('id', '!=', currentUserId)
        .andWhere((builder) => {
          builder.where('username', 'ilike', `%${query}%`)
            .orWhere('email', 'ilike', `%${query}%`);
        })
        .limit(20);

      return users;
    } catch (error: any) {
      return { error: error.message };
    }
  }

  // Update online status
  static async updateOnlineStatus(userId: string, isOnline: boolean): Promise<void | { success: boolean } | { error: string }> {
    try {
      await db('users').where({ id: userId }).update({
        is_online: isOnline,
        last_seen: isOnline ? null : new Date(),
      });
      return { success: true };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  // Get all users (for directory)
  static async getAllUsers(currentUserId: string): Promise<UserResponse[] | { error: string }> {
    try {
      const users = await db('users')
        .select('id', 'username', 'email', 'avatar', 'is_online', 'last_seen', 'created_at')
        .where('id', '!=', currentUserId)
        .orderBy('username', 'asc');

      return users;
    } catch (error: any) {
      return { error: error.message };
    }
  }

  // Update user profile
  static async updateProfile(userId: string, data: Partial<User>): Promise<UserResponse | { error: string }> {
    try {
      // Only update allowed fields
      const updateData: any = {};
      if (data.username) updateData.username = data.username;
      if (data.avatar !== undefined) updateData.avatar = data.avatar;

      const [user] = await db('users')
        .where({ id: userId })
        .update(updateData)
        .returning(['id', 'username', 'email', 'avatar', 'is_online', 'last_seen', 'created_at']);

      return user;
    } catch (error: any) {
      return { error: error.message };
    }
  }
}
