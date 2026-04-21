// User Types
export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  avatar?: string;
  is_online: boolean;
  last_seen?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  is_online: boolean;
  last_seen?: Date;
  created_at: Date;
}

// Chat Types
export enum ChatType {
  DIRECT = 'direct',
  GROUP = 'group'
}

export interface Chat {
  id: string;
  name?: string; // For group chats
  type: ChatType;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

// Chat Member Types
export enum MemberRole {
  ADMIN = 'admin',
  MEMBER = 'member'
}

export interface ChatMember {
  id: string;
  chat_id: string;
  user_id: string;
  role: MemberRole;
  joined_at: Date;
}

// Message Types
export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read'
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  status: MessageStatus;
  reply_to?: string;
  created_at: Date;
  updated_at: Date;
}

// Invitation Types
export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected'
}

export interface Invitation {
  id: string;
  chat_id: string;
  inviter_id: string;
  invitee_id: string;
  status: InvitationStatus;
  created_at: Date;
  updated_at: Date;
}

// Socket Types
export interface SocketUser {
  userId: string;
  socketId: string;
}

// JWT Payload
export interface JWTPayload {
  userId: string;
  email: string;
}

// Request with User
export interface AuthRequest extends Request {
  user?: JWTPayload;
}
