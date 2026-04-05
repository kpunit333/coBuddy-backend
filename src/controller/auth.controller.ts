import { Router } from 'express';
import multer from 'multer';
import * as authService from '../services/auth.service.ts';

const authController = Router();

const upload = multer({ storage: multer.memoryStorage() });

// Public
authController.post('/login', authService.login);
authController.post('/signup', upload.single('profileImg'), authService.signup);
authController.post('/refresh', authService.refreshTokens);
// authController.get('/google', authService.getGoogleLoginPage);
// authController.get('/google/callback', authService.getGoogleLoginCallback);

export default authController;
