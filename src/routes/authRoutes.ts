import { Router } from 'express';
import { login, signup, googleInit, googleCallback, guestLogin } from '../services/auth.service.js';

const authRouter = Router();

// Final path: localhost:8080/v1/api/auth/login
authRouter.post('/login', login);
authRouter.post('/signup', signup);
authRouter.get('/google/init', googleInit);
authRouter.get('/google/callback', googleCallback);
authRouter.post('/guest', guestLogin);

export default authRouter;