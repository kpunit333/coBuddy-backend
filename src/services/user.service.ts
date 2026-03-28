import User from "../models/user";
import { Request, Response } from 'express';
import { ResponseBody } from "../utils/response";

export const getUsers = async (req: Request, res: Response): Promise<void> => {
    let response = new ResponseBody();
    try {
        const users = await User.find({}, '-password -createdAt -updatedAt');

        response.setData(users);
        response.setSuccess(true);
        response.setMessage('Users retrieved successfully');

        res.status(200).json(response);

    } catch (error: any) {
        response.setMessage(error.message || 'Server error');
        res.status(500).json(response);
        return;
    }
};