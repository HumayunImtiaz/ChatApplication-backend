import Joi from 'joi';

// User Validation Schemas
export const registerSchema = Joi.object({
  username: Joi.string().min(3).max(50).required().messages({
    'string.min': 'Username must be at least 3 characters',
    'string.max': 'Username cannot exceed 50 characters',
    'string.empty': 'Username is required',
    'any.required': 'Username is required',
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email',
    'string.empty': 'Email is required',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters',
    'string.empty': 'Password is required',
    'any.required': 'Password is required',
  }),
  avatar: Joi.string().uri().optional(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email',
    'string.empty': 'Email is required',
    'any.required': 'Email is required',
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Password is required',
    'any.required': 'Password is required',
  }),
});

// Chat Validation Schemas
export const createDirectChatSchema = Joi.object({
  invitee_id: Joi.string().uuid().required().messages({
    'string.guid': 'Invalid user ID format',
    'any.required': 'Invitee ID is required',
  }),
});

export const createGroupChatSchema = Joi.object({
  name: Joi.string().min(1).max(100).required().messages({
    'string.min': 'Group name must be at least 1 character',
    'string.max': 'Group name cannot exceed 100 characters',
    'any.required': 'Group name is required',
  }),
  member_ids: Joi.array().items(Joi.string().uuid()).min(1).optional(),
  avatar: Joi.string().uri().allow('', null).optional().messages({
    'string.uri': 'Avatar must be a valid URL',
  }),
});

export const updateGroupChatSchema = Joi.object({
  name: Joi.string().min(1).max(100).optional().messages({
    'string.min': 'Group name must be at least 1 character',
    'string.max': 'Group name cannot exceed 100 characters',
  }),
  avatar: Joi.string().uri().allow('', null).optional().messages({
    'string.uri': 'Avatar must be a valid URL',
  }),
});

// Message Validation Schemas
export const sendMessageSchema = Joi.object({
  chat_id: Joi.string().uuid().required().messages({
    'string.guid': 'Invalid chat ID format',
    'any.required': 'Chat ID is required',
  }),
  content: Joi.string().min(1).max(5000).required().messages({
    'string.min': 'Message cannot be empty',
    'string.max': 'Message is too long (max 5000 characters)',
    'any.required': 'Message content is required',
  }),
  reply_to: Joi.string().uuid().optional().allow(null, '').messages({
    'string.guid': 'Invalid reply message ID format',
  }),
});

export const updateMessageStatusSchema = Joi.object({
  message_ids: Joi.array().items(Joi.string().uuid()).min(1).required().messages({
    'array.min': 'At least one message ID is required',
    'any.required': 'Message IDs are required',
  }),
  status: Joi.string().valid('delivered', 'read').required().messages({
    'any.only': 'Status must be either delivered or read',
    'any.required': 'Status is required',
  }),
});

// Invitation Validation Schemas
export const inviteToGroupSchema = Joi.object({
  chat_id: Joi.string().uuid().required().messages({
    'string.guid': 'Invalid chat ID format',
    'any.required': 'Chat ID is required',
  }),
  invitee_id: Joi.string().uuid().required().messages({
    'string.guid': 'Invalid user ID format',
    'any.required': 'Invitee ID is required',
  }),
});

export const respondToInvitationSchema = Joi.object({
  invitation_id: Joi.string().uuid().required().messages({
    'string.guid': 'Invalid invitation ID format',
    'any.required': 'Invitation ID is required',
  }),
  accept: Joi.boolean().required().messages({
    'any.required': 'Response (accept/reject) is required',
  }),
});
