import { Router } from 'express';
import { MessageController } from '../controllers/messageController.js';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validation.js';
import { sendMessageSchema, updateMessageStatusSchema } from '../validators/index.js';
import { upload } from '../config/multer.js';

const router = Router();

// All message routes are protected
router.use(authenticate);

router.post('/', validate(sendMessageSchema), MessageController.sendMessage);
router.get('/:chatId', MessageController.getChatMessages);
router.patch('/status', validate(updateMessageStatusSchema), MessageController.updateMessageStatus);
router.patch('/:chatId/read', MessageController.markAsRead);
router.post('/upload', upload.single('file'), MessageController.uploadFile);
router.put('/:id', MessageController.updateMessage);
router.delete('/:id', MessageController.deleteMessage);
router.get('/:chatId/shared-files', MessageController.getSharedFiles);

export default router;
