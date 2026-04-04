import { Router } from 'express';
import * as authService from '../services/auth.service.js';

const authController = Router();

// Public
authController.post('/login', authService.login);
authController.post('/signup', authService.signup);
authController.post('/refresh', authService.refreshTokens);
// authController.get('/google', authService.getGoogleLoginPage);
// authController.get('/google/callback', authService.getGoogleLoginCallback);

export default authController;
