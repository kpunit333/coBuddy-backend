import { Request, Response } from 'express';
import User from '../models/user.js';
import { generateTokenPair } from '../utils/token-generator.js';
import { ResponseBody } from '../utils/response.js';

interface AuthRequestBody {
  username?: string;
  fullname?: string;
  lastname?: string;
  emailId?: string;
  password?: string;
}

export const signup = async (req: Request, res: Response): Promise<void> => {
  let response = new ResponseBody();
  try {
    const { username, fullname, emailId, password } = req.body as AuthRequestBody;
    // Validate required fields
    if (!username || !fullname || !emailId || !password) {
      response.setMessage('All fields are required: username, fullname, emailId, password');
      res.status(400).json(response);
      return;
    }

    // Check if user already exists (by email or username)
    const existingUser = await User.findOne({
      $or: [{ emailId: emailId.toLowerCase() }, { username: username.toLowerCase() }]
    });

    if (existingUser) {
      response.setMessage('User already exists with this email or username');
      res.status(400).json(response);
      return;
    }

    // Create new user (password will be hashed by pre-save hook in model)
    const user = await User.create({
      username: username.toLowerCase(),
      fullname,
      emailId: emailId.toLowerCase(),
      password,
    });

    let userData = {
      user: {
        id: user._id,
        username: user.username,
        fullname: user.fullname,
        emailId: user.emailId,
      }
    };

    response.setData(userData);
    response.setSuccess(true);
    response.setMessage('User registered successfully');

    res.status(201).json(response);

  } catch (error) {
    console.error('Signup Error:', error);

    response.setMessage('Server error during registration');
    res.status(500).json(response);
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  let response = new ResponseBody();
  try {
    const { emailId, password, username } = req.body as AuthRequestBody;

    // Validate required fields
    if (!password || (!emailId && !username)) {
      response.setMessage('Email/username and password are required');
      res.status(400).json(response);
      return;
    }

    // Find user by email or username
    const query = emailId ? { emailId: emailId.toLowerCase() } : { username: (username as string).toLowerCase() };
    
    // Select password explicitly since it's excluded by default
    const user = await User.findOne(query).select('+password');

    if (!user) {
      response.setMessage('Invalid credentials');
      res.status(401).json(response);
      return;
    }

    // Compare password
    const isPasswordMatch = await user.comparePassword(password as string);

    if (!isPasswordMatch) {
      response.setMessage('Invalid credentials');
      res.status(401).json(response);
      return;
    }

    // Generate tokens
    const tokens = generateTokenPair({
      userId: user._id.toString(),
      emailId: user.emailId,
    });

    let userData = {
      user: {
        id: user._id,
        username: user.username,
        fullname: user.fullname,
        emailId: user.emailId,
      },
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      }
    };

    response.setData(userData);
    response.setSuccess(true);
    response.setMessage('Login successful');
    res.status(200).json(response);

  } catch (error) {
    console.error('Login Error:', error);

    response.setMessage('Server error during login');
    res.status(500).json(response);
  }
};