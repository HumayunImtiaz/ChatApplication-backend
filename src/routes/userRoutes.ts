import { Router } from 'express';
import { UserController } from '../controllers/userController.js';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validation.js';
import { registerSchema, loginSchema } from '../validators/index.js';

const router = Router();

// Public routes
router.post('/register', validate(registerSchema), UserController.register);
router.post('/login', validate(loginSchema), UserController.login);

// Protected routes
router.get('/profile', authenticate, UserController.getProfile);
router.patch('/profile', authenticate, UserController.updateProfile);
router.get('/search', authenticate, UserController.searchUsers);
router.get('/all', authenticate, UserController.getAllUsers);
router.get('/:id', authenticate, UserController.getUserById);
router.post('/logout', authenticate, UserController.logout);

export default router;
