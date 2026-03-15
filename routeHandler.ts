import { Router } from "express";
import authRouter from "./src/routes/authRoutes";

const routeHandler = Router();

routeHandler.use('/auth', authRouter);

export default routeHandler;