import { Router } from 'express';
import * as authService from '../services/auth.service.js';
const authController = Router();

// Final path: localhost:8080/v1/api/auth/login
authController.post('/login', authService.login);
authController.post('/signup', authService.signup);
authController.get('/google', authService.getGoogleLoginPage);
authController.get('/google/callback', authService.getGoogleLoginCallback);

export default authController;