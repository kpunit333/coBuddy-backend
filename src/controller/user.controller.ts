import { Router } from 'express';
import * as userService from '../services/user.service.ts';
import { authenticateToken } from '../middleware/auth.middleware.ts';

const userController = Router();

userController.get('/getUsers', authenticateToken, userService.getUsers);

export default userController;