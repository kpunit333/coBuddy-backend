import { Router } from 'express';
import * as authService from '../services/auth.service.js';
const authController = Router();

// Final path: localhost:8080/api/v1/auth/login
authController.post('/login', authService.login);
authController.post('/signup', authService.signup);
// authController.get('/google/callback', authService.getGoogleLoginCallback);
// authController.get('/google', authService.getGoogleLoginPage);

export default authController;