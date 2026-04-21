import { Router } from 'express';
import userRoutes from './userRoutes.js';
import chatRoutes from './chatRoutes.js';
import messageRoutes from './messageRoutes.js';
import invitationRoutes from './invitationRoutes.js';

const router = Router();

router.use('/users', userRoutes);
router.use('/chats', chatRoutes);
router.use('/messages', messageRoutes);
router.use('/invitations', invitationRoutes);

export default router;
