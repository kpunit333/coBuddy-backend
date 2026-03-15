import { Router } from 'express';
import { login, signup } from '../controllers/authController.js';

const authRouter = Router();

// Final path: localhost:8080/v1/api/auth/login
authRouter.post('/login', login);
authRouter.post('/signup', signup);

export default authRouter;