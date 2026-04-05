import { decodeIdToken, generateCodeVerifier, generateState } from 'arctic';
import { CookieOptions, Request, Response } from 'express';
import mongoose from 'mongoose';
import { google } from '../instances/googleInstance.ts';
import User from '../models/user.ts';
import { ResponseBody } from '../utils/response.ts';
import { generateTokenPair, verifyRefreshToken } from '../utils/token-generator.ts';
import { uploadMedia } from './media.service.ts';

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
      username: payload.username,
      fullname: payload.fullname,
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

  console.log("pf img", req.file);
  console.log("body ", req.body);
  
  
  const response = new ResponseBody();
  const session = await mongoose.startSession();

  session.startTransaction();

  try {
    const { username, fullname, emailId, password } = req.body as AuthRequestBody;
    if (!username || !fullname || !emailId || !password) {
      response.setMessage('All fields required');
      res.status(400).json(response);
      return;
    }

    const existingUser = await User.findOne({
      $or: [{ emailId: emailId.toLowerCase() }, { username: username.toLowerCase() }]
    }).session(session);

    if (existingUser) {
      response.setMessage('User with given email or username already exists');
      res.status(400).json(response);
      return;
    }

    let mediaResult = null;
    if (req.file) {
      mediaResult = await uploadMedia(req.file);
      if (!mediaResult.success) {
        response.setMessage('Failed to upload profile image');
        res.status(400).json(response);
        return;
      }
    }

    console.log("media result ", mediaResult);

    const user = await User.create([{
      username: username.toLowerCase(),
      fullname,
      emailId: emailId.toLowerCase(),
      password,
      profileImg: mediaResult ? mediaResult.data.secure_url : null,
    }], { session });

    response.setData({
      user: {
        id: user[0]._id,
        username: user[0].username,
        fullname: user[0].fullname,
        emailId: user[0].emailId,
        profileImg: user[0].profileImg,
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
      response.setMessage('EmailId/username and password required');
      res.status(400).json(response);
      return;
    }

    const query = emailId ? { emailId: emailId.toLowerCase() } : { username: username!.toLowerCase() };
    const user = await User.findOne(query).select('+password').session(session);

    if (!user) {
      response.setMessage('Invalid credentials');
      res.status(400).json(response);
      return;
    }

    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      response.setMessage('Invalid credentials');
      res.status(400).json(response);
      return;
    }

    const tokens = generateTokenPair({
      userId: user._id.toString(),
      username: user.username,
      fullname: user.fullname,
      emailId: user.emailId,
    });

    response.setData({
      user: {
        id: user._id,
        username: user.username,
        fullname: user.fullname,
        emailId: user.emailId,
        profileImg: user.profileImg,
      },
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      }
    });

    response.setSuccess(true);
    response.setMessage('Login successful');

    await session.commitTransaction();

    res.status(200).json(response);

  } catch (error: any) {

    await session.abortTransaction();

    console.error('Login Error:', error);
    
    response.setMessage(error.message || 'Server error');
    res.status(400).json(response);

  } finally {
    await session.endSession();
  }
};


export const getGoogleLoginPage = async (req: any, res: Response) => {
  console.log("g l p", req.body, req.user);
  
  if (req.user) return res.redirect("/");

  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const url = google.createAuthorizationURL(state, codeVerifier, [
    "openid", // this is called scopes, here we are giving openid, and profile
    "profile", // openid gives tokens if needed, and profile gives user information
    // we are telling google about the information that we require from user.
    "email",
  ]);

  console.log("auth url", url);
  

  const cookieConfig: CookieOptions = {
    httpOnly: true,
    secure: true,
    maxAge: 15 * 60 * 1000, // 15 minutes in milliseconds
    sameSite: "lax", // this is such that when google redirects to our website, cookies are maintained
  };

  res.cookie("google_oauth_state", state, cookieConfig);
  res.cookie("google_code_verifier", codeVerifier, cookieConfig);

  console.log(state, codeVerifier);
  
  console.log("old header", res.header);
  
  
  res.header({
    "Access-Control-Allow-Origin": "http://localhost:5173",
    "Access-Control-Allow-Credentials": "true",
  });

  console.log( "new header", res.header);
  
  res.redirect(url.toString());
};

//getGoogleLoginCallback
export const getGoogleLoginCallback = async (req: Request, res: Response) => {
  // google redirects with code, and state in query params
  // we will use code to find out the user
  console.log("cll bk", req);

  const { code , state }: any = req.query;
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
    return res.redirect("/auth");
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
    return res.redirect("/auth");
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
