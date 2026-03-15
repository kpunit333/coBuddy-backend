import { Request, Response } from 'express';
import User from '../models/user.js';
import { generateTokenPair } from '../utils/token-generator.js';

interface AuthRequestBody {
  username?: string;
  fullname?: string;
  lastname?: string;
  emailid?: string;
  password?: string;
}

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, fullname, lastname, emailid, password } = req.body as AuthRequestBody;

    // Validate required fields
    if (!username || !fullname || !lastname || !emailid || !password) {
      res.status(400).json({ 
        success: false,
        message: 'All fields are required: username, fullname, lastname, emailid, password' 
      });
      return;
    }

    // Check if user already exists (by email or username)
    const existingUser = await User.findOne({
      $or: [{ emailid: emailid.toLowerCase() }, { username: username.toLowerCase() }]
    });

    if (existingUser) {
      res.status(400).json({ 
        success: false,
        message: 'User already exists with this email or username' 
      });
      return;
    }

    // Create new user (password will be hashed by pre-save hook in model)
    const user = await User.create({
      username: username.toLowerCase(),
      fullname,
      lastname,
      emailid: emailid.toLowerCase(),
      password,
    });

    // Generate tokens
    const tokens = generateTokenPair({
      userId: user._id.toString(),
      email: user.emailid,
    });

    res.status(201).json({ 
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          username: user.username,
          fullname: user.fullname,
          lastname: user.lastname,
          emailid: user.emailid,
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      }
    });
  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during registration' 
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  console.log(req.body);
  
  try {
    const { emailid, password, username } = req.body as AuthRequestBody;

    // Validate required fields
    if (!password || (!emailid && !username)) {
      res.status(400).json({ 
        success: false,
        message: 'Email/username and password are required' 
      });
      return;
    }

    // Find user by email or username
    const query = emailid ? { emailid: emailid.toLowerCase() } : { username: (username as string).toLowerCase() };
    
    // Select password explicitly since it's excluded by default
    const user = await User.findOne(query).select('+password');

    if (!user) {
      res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
      return;
    }

    // Compare password
    const isPasswordMatch = await user.comparePassword(password as string);

    if (!isPasswordMatch) {
      res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
      return;
    }

    // Generate tokens
    const tokens = generateTokenPair({
      userId: user._id.toString(),
      email: user.emailid,
    });

    res.status(200).json({ 
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          username: user.username,
          fullname: user.fullname,
          lastname: user.lastname,
          emailid: user.emailid,
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during login' 
    });
  }
};

