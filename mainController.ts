import { Router } from "express";
import authController from "./src/controller/auth.controller";
import userController from "./src/controller/user.controller";

const mainController = Router();

mainController.use('/auth', authController);
mainController.use('/users', userController);

export default mainController;
