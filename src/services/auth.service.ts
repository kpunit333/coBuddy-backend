import mongoose from 'mongoose';
import { Request, Response } from 'express';
import User from '../models/user.js';
import { generateTokenPair, verifyRefreshToken } from '../utils/token-generator.js';
import { ResponseBody } from '../utils/response.js';

interface AuthRequestBody {
  username?: string;
  fullname?: string;
  emailId?: string;
  password?: string;
}

export const refreshTokens = async (req: Request, res: Response): Promise<void> => {
  const response = new ResponseBody();
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      response.setMessage('Refresh token required');
      res.status(400).json(response);
      return;
    }

    const payload = verifyRefreshToken(refreshToken);

    const tokens = generateTokenPair({
      userId: payload.userId,
      emailId: payload.emailId,
    });

    response.setData({
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      }
    });

    response.setSuccess(true);
    response.setMessage('Tokens refreshed');
    res.status(200).json(response);

  } catch (error) {

    response.setMessage('Invalid refresh token');
    res.status(401).json(response);
    
  }
};

export const signup = async (req: Request, res: Response): Promise<void> => {

  const response = new ResponseBody();
  const session = await mongoose.startSession();

  session.startTransaction();

  try {
    const { username, fullname, emailId, password } = req.body as AuthRequestBody;
    if (!username || !fullname || !emailId || !password) {
      throw new Error('All fields required');
    }

    const existingUser = await User.findOne({
      $or: [{ emailId: emailId.toLowerCase() }, { username: username.toLowerCase() }]
    }).session(session);

    if (existingUser) {
      throw new Error('User exists');
    }

    const user = await User.create([{
      username: username.toLowerCase(),
      fullname,
      emailId: emailId.toLowerCase(),
      password,
    }], { session });

    response.setData({
      user: {
        id: user[0]._id,
        username: user[0].username,
        fullname: user[0].fullname,
        emailId: user[0].emailId,
      }
    });

    response.setSuccess(true);
    response.setMessage('User registered successfully');

    await session.commitTransaction();

    res.status(201).json(response);

  } catch (error: any) {

    await session.abortTransaction();

    console.error('Signup Error:', error);

    response.setMessage(error.message || 'Server error');
    res.status(400).json(response);

  } finally {
    await session.endSession();
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {

  const response = new ResponseBody();
  const session = await mongoose.startSession();
  
  session.startTransaction();

  try {
    const { emailId, password, username } = req.body as AuthRequestBody;
    if (!password || (!emailId && !username)) {
      throw new Error('emailId/username and password required');
    }

    const query = emailId ? { emailId: emailId.toLowerCase() } : { username: username!.toLowerCase() };
    const user = await User.findOne(query).select('+password').session(session);

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      throw new Error('Invalid credentials');
    }

    const tokens = generateTokenPair({
      userId: user._id.toString(),
      emailId: user.emailId,
    });

    response.setData({
      user: {
        id: user._id,
        username: user.username,
        fullname: user.fullname,
        emailId: user.emailId,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });

    response.setSuccess(true);
    response.setMessage('Login successful');

    await session.commitTransaction();

    res.status(200).json(response);

  } catch (error: any) {

    await session.abortTransaction();

    console.error('Login Error:', error);
    
    response.setMessage(error.message || 'Server error');
    res.status(401).json(response);

  } finally {
    await session.endSession();
  }
};

