import { Router } from 'express';
import { login, signup } from '../controllers/authController.js';

const router = Router();

// Final path: localhost:8080/api/auth/login
router.post('/login', login);
router.post('/signup', signup);

export default router;