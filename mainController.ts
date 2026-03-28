import { Router } from "express";
import authController from "./src/controller/auth.controller";

const mainController = Router();

mainController.use('/auth', authController);

export default mainController;
