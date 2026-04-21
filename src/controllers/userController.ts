import { Request, Response } from 'express';
import { UserService } from '../services/userService.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthRequest } from '../middlewares/auth.js';

export class UserController {
  // Register new user
  static async register(req: Request, res: Response): Promise<Response> {
    try {
      const { username, email, password, avatar } = req.body;

      const result = await UserService.register(username, email, password, avatar);
      if (result && 'error' in result) return sendError(res, 400, result.error);

      return sendSuccess(res, 201, 'User registered successfully', result);
    } catch (error: any) {
      return sendError(res, 400, error.message);
    }
  }

  // Login user
  static async login(req: Request, res: Response): Promise<Response> {
    try {
      const { email, password } = req.body;

      const result = await UserService.login(email, password);
      if (result && 'error' in result) return sendError(res, 401, result.error);

      return sendSuccess(res, 200, 'Login successful', result);
    } catch (error: any) {
      return sendError(res, 401, error.message);
    }
  }

  // Get current user profile
  static async getProfile(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user!.userId;

      const user = await UserService.getUserById(userId);
      if (user && 'error' in user) return sendError(res, 404, user.error);

      if (!user) {
        return sendError(res, 404, 'User not found');
      }

      return sendSuccess(res, 200, 'Profile fetched successfully', user);
    } catch (error: any) {
      return sendError(res, 500, error.message);
    }
  }

  // Search users
  static async searchUsers(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { query } = req.query;
      const userId = req.user!.userId;

      if (!query || typeof query !== 'string') {
        return sendError(res, 400, 'Search query is required');
      }

      const users = await UserService.searchUsers(query, userId);
      if (!Array.isArray(users)) return sendError(res, 400, users.error);

      return sendSuccess(res, 200, 'Users fetched successfully', users);
    } catch (error: any) {
      return sendError(res, 500, error.message);
    }
  }

  // Get all users
  static async getAllUsers(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user!.userId;

      const users = await UserService.getAllUsers(userId);
      if (!Array.isArray(users)) return sendError(res, 400, users.error);

      return sendSuccess(res, 200, 'Users fetched successfully', users);
    } catch (error: any) {
      return sendError(res, 500, error.message);
    }
  }

  // Get user by ID
  static async getUserById(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      const user = await UserService.getUserById(id);
      if (user && 'error' in user) return sendError(res, 404, user.error);

      if (!user) {
        return sendError(res, 404, 'User not found');
      }

      return sendSuccess(res, 200, 'User fetched successfully', user);
    } catch (error: any) {
      return sendError(res, 500, error.message);
    }
  }

  // Logout user
  static async logout(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user!.userId;

      const result = await UserService.updateOnlineStatus(userId, false);
      if (result && typeof result === 'object' && 'error' in result) return sendError(res, 400, result.error);

      return sendSuccess(res, 200, 'Logout successful');
    } catch (error: any) {
      return sendError(res, 500, error.message);
    }
  }

  // Update profile
  static async updateProfile(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user!.userId;
      const { username, avatar } = req.body;

      const user = await UserService.updateProfile(userId, { username, avatar });
      if (user && 'error' in user) return sendError(res, 400, user.error);

      return sendSuccess(res, 200, 'Profile updated successfully', user);
    } catch (error: any) {
      return sendError(res, 500, error.message);
    }
  }
}