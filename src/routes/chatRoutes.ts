import { Router } from 'express';
import { ChatController } from '../controllers/chatController.js';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validation.js';
import {
  createDirectChatSchema,
  createGroupChatSchema,
  inviteToGroupSchema,
} from '../validators/index.js';

const router = Router();

// All chat routes are protected
router.use(authenticate);

router.post('/direct', validate(createDirectChatSchema), ChatController.createDirectChat);
router.post('/group', validate(createGroupChatSchema), ChatController.createGroupChat);
router.get('/', ChatController.getUserChats);
router.get('/:chatId', ChatController.getChatById);
router.post('/invite', validate(inviteToGroupSchema), ChatController.inviteToGroup);
router.delete('/:chatId/leave', ChatController.leaveChat);

export default router;
