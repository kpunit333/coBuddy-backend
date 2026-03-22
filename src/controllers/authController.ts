import { Request, Response } from 'express';
import User from '../models/user.js';
import OAuthTokens from '../models/OAuthTokens.js';
import { generateTokenPair } from '../utils/token-generator.js';
import { Google, generateState, generateCodeVerifier } from 'arctic';
import crypto from 'crypto';

interface AuthRequestBody {
  username?: string;
  fullname?: string;
  lastname?: string;
  emailid?: string;
  password?: string;
}

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, fullname, emailid, password } = req.body as AuthRequestBody;

    // Validate required fields
    if (!username || !fullname || !emailid || !password) {
      res.status(400).json({ 
        success: false,
        message: 'All fields are required: username, fullname, emailid, password' 
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

export const googleInit = async (req: Request, res: Response): Promise<void> => {
  try {
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID!;
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET!;
    const redirectURI = `http://${process.env.SERVER_URL}:${process.env.SERVER_PORT}/v1/api/auth/google/callback`;
    const google = new Google(clientId, clientSecret, redirectURI);

    const state = generateState();
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await google.oAuth2Client.codeChallenge(codeVerifier);
    const scopes = ['openid', 'profile', 'email'];

    const url = google.createAuthorizationURL(state, scopes, codeChallenge);

    res.cookie('oauth_state', state, { httpOnly: true, secure: false, sameSite: 'lax' });
    res.cookie('oauth_code_verifier', codeVerifier, { httpOnly: true, secure: false, sameSite: 'lax' });

    res.json({ 
      success: true,
      data: { authorizationUrl: url.toString() }
    });
  } catch (error) {
    console.error('Google Init Error:', error);
    res.status(500).json({ success: false, message: 'Server error in Google auth init' });
  }
};

export const googleCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    const code = req.query.code as string;
    const state = req.query.state as string;
    const { oauth_state, oauth_code_verifier } = req.cookies;

    if (!code || !state || !oauth_state || !oauth_code_verifier || state !== oauth_state) {
      res.status(400).json({ success: false, message: 'Invalid OAuth callback' });
      return;
    }

    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID!;
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET!;
    const redirectURI = `http://${process.env.SERVER_URL}:${process.env.SERVER_PORT}/v1/api/auth/google/callback`;
    const google = new Google(clientId, clientSecret, redirectURI);

    const tokens = await google.validateAuthorizationCode(code, oauth_code_verifier);

    // Fetch profile
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token()}` },
    });
    const profile = await profileResponse.json();

    let user = await User.findOne({ googleId: profile.id }) || await User.findOne({ emailid: profile.email.toLowerCase() });

    if (!user) {
      user = new User({
        username: `google_${profile.id.slice(-8)}`,
        fullname: profile.name,
        emailid: profile.email.toLowerCase(),
        googleId: profile.id,
      });
      await user.save();
    }

    // Store tokens
    await OAuthTokens.findOneAndUpdate(
      { userId: user._id },
      {
        access_token: tokens.access_token(),
        access_expires_at: new Date(Date.now() + tokens.expires_in! * 1000),
        refresh_token: tokens.refresh_token(),
        refresh_expires_at: tokens.refresh_token_expires_in ? new Date(Date.now() + tokens.refresh_token_expires_in * 1000) : undefined,
      },
      { upsert: true }
    );

    const jwtTokens = generateTokenPair({ userId: user._id.toString(), email: user.emailid });

    res.clearCookie('oauth_state');
    res.clearCookie('oauth_code_verifier');

    // Redirect to frontend with tokens
    const frontendUrl = `http://localhost:5173/auth/callback?accessToken=${jwtTokens.accessToken}&refreshToken=${jwtTokens.refreshToken}&userId=${user._id}&username=${user.username}`;
    res.redirect(frontendUrl);
  } catch (error) {
    console.error('Google Callback Error:', error);
    res.status(500).json({ success: false, message: 'Server error in Google callback' });
  }
};

export const guestLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const guestUsername = `guest_${crypto.randomBytes(4).toString('hex')}`;
    const guestEmail = `guest_${guestUsername}@cobuddy.local`;

    const existingGuest = await User.findOne({ username: guestUsername });
    if (existingGuest) {
      return guestLogin(req, res); // retry
    }

    const user = await User.create({
      username: guestUsername,
      fullname: 'Guest User',
      emailid: guestEmail,
      password: 'guest', // dummy, not used
      isGuest: true,
    });

    const tokens = generateTokenPair({
      userId: user._id.toString(),
      email: user.emailid,
    });

    res.status(200).json({ 
      success: true,
      message: 'Guest login successful',
      data: {
        user: {
          id: user._id,
          username: user.username,
          fullname: user.fullname,
          emailid: user.emailid,
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      }
    });
  } catch (error) {
    console.error('Guest Login Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error in guest login' 
    });
  }
};

