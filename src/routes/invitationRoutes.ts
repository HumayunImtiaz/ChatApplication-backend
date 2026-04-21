import { Router } from 'express';
import { InvitationController } from '../controllers/invitationController.js';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validation.js';
import { respondToInvitationSchema } from '../validators/index.js';

const router = Router();

// All invitation routes are protected
router.use(authenticate);

router.get('/', InvitationController.getUserInvitations);
router.post('/respond', validate(respondToInvitationSchema), InvitationController.respondToInvitation);

export default router;
