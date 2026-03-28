import { Router } from 'express';
import * as authService from '../services/auth.service.js';
const authController = Router();

authController.post('/login', authService.login);
authController.post('/signup', authService.signup);

export default authController;