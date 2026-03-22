import { decodeIdToken, generateCodeVerifier, generateState } from 'arctic';
import { CookieOptions, Request, Response } from 'express';
import OAuthTokens from '../models/OAuthTokens.js';
import User from '../models/user.js';
import { generateTokenPair } from '../utils/token-generator.js';
import { google } from '../instances/googleInstance.js';

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

export const getGoogleLoginPage = async (req: Request, res: Response) => {
  console.log("g l p", req);
  
  if (req.body) return res.redirect("/");

  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const url = google.createAuthorizationURL(state, codeVerifier, [
    "openid", // this is called scopes, here we are giving openid, and profile
    "profile", // openid gives tokens if needed, and profile gives user information
    // we are telling google about the information that we require from user.
    "email",
  ]);

  const cookieConfig: CookieOptions = {
    httpOnly: true,
    secure: true,
    maxAge: 15 * 60 * 1000, // 15 minutes in milliseconds
    sameSite: "lax", // this is such that when google redirects to our website, cookies are maintained
  };

  res.cookie("google_oauth_state", state, cookieConfig);
  res.cookie("google_code_verifier", codeVerifier, cookieConfig);

  res.redirect(url.toString());
};

//getGoogleLoginCallback
export const getGoogleLoginCallback = async (req: Request, res: Response) => {
  // google redirects with code, and state in query params
  // we will use code to find out the user
  console.log("cll bk", req);

  const { code , state } = req.query;
  console.log(code, state);

  const {
    google_oauth_state: storedState,
    google_code_verifier: codeVerifier,
  } = req.cookies;
  

  if (
    !code ||
    !state ||
    !storedState ||
    !codeVerifier ||
    state !== storedState
  ) {
    res.send(401).json({
      success: false,
      message: "Couldn't login with Google because of invalid login attempt. Please try again!"
    });
    return res.redirect("/login");
  }

  let tokens;
  try {
    // arctic will verify the code given by google with code verifier internally
    tokens = await google.validateAuthorizationCode(code, codeVerifier);
  } catch {
    res.send(401).json({
      success: false,
      message: "Couldn't login with Google because of invalid login attempt. Please try again!"
    });
    return res.redirect("/login");
  }

  console.log("token google: ", tokens);

  const claims = decodeIdToken(tokens.idToken());
  console.log("claim: ", claims);

  // const { sub: googleUserId, name, email, picture } = claims;

  //! there are few things that we should do
  // Condition 1: User already exists with google's oauth linked
  // Condition 2: User already exists with the same email but google's oauth isn't linked
  // Condition 3: User doesn't exist.

  // if user is already linked then we will get the user
  // let user = await getUserWithOauthId({
  //   provider: "google",
  //   email,
  // });

  // // if user exists but user is not linked with oauth
  // if (user && !user.providerAccountId) {
  //   await linkUserWithOauth({
  //     userId: user.id,
  //     provider: "google",
  //     providerAccountId: googleUserId,
  //     avatarUrl: picture,
  //   });
  // }

  // // if user doesn't exist
  // if (!user) {
  //   user = await createUserWithOauth({
  //     name,
  //     email,
  //     provider: "google",
  //     providerAccountId: googleUserId,
  //     avatarUrl: picture,
  //   });
  // }
  // await authenticateUser({ req, res, user, name, email });

  res.redirect("/");
};
