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


// export const getGoogleLoginPage = async (req, res: Response) => {
//   console.log("g l p", req.body, req.user);
  
//   if (req.user) return res.redirect("/");

//   const state = generateState();
//   const codeVerifier = generateCodeVerifier();
//   const url = google.createAuthorizationURL(state, codeVerifier, [
//     "openid", // this is called scopes, here we are giving openid, and profile
//     "profile", // openid gives tokens if needed, and profile gives user information
//     // we are telling google about the information that we require from user.
//     "email",
//   ]);

//   console.log("auth url", url);
  

//   const cookieConfig: CookieOptions = {
//     httpOnly: true,
//     secure: true,
//     maxAge: 15 * 60 * 1000, // 15 minutes in milliseconds
//     sameSite: "lax", // this is such that when google redirects to our website, cookies are maintained
//   };

//   res.cookie("google_oauth_state", state, cookieConfig);
//   res.cookie("google_code_verifier", codeVerifier, cookieConfig);

//   console.log(state, codeVerifier);
  

//   res.redirect(url.toString());
// };

// //getGoogleLoginCallback
// export const getGoogleLoginCallback = async (req: Request, res: Response) => {
//   // google redirects with code, and state in query params
//   // we will use code to find out the user
//   console.log("cll bk", req);

//   const { code , state } = req.query;
//   console.log(code, state);

//   const {
//     google_oauth_state: storedState,
//     google_code_verifier: codeVerifier,
//   } = req.cookies;
  

//   if (
//     !code ||
//     !state ||
//     !storedState ||
//     !codeVerifier ||
//     state !== storedState
//   ) {
//     res.send(401).json({
//       success: false,
//       message: "Couldn't login with Google because of invalid login attempt. Please try again!"
//     });
//     return res.redirect("/auth");
//   }

//   let tokens;
//   try {
//     // arctic will verify the code given by google with code verifier internally
//     tokens = await google.validateAuthorizationCode(code, codeVerifier);
//   } catch {
//     res.send(401).json({
//       success: false,
//       message: "Couldn't login with Google because of invalid login attempt. Please try again!"
//     });
//     return res.redirect("/auth");
//   }

//   console.log("token google: ", tokens);

//   const claims = decodeIdToken(tokens.idToken());
//   console.log("claim: ", claims);

//   // const { sub: googleUserId, name, email, picture } = claims;

//   //! there are few things that we should do
//   // Condition 1: User already exists with google's oauth linked
//   // Condition 2: User already exists with the same email but google's oauth isn't linked
//   // Condition 3: User doesn't exist.

//   // if user is already linked then we will get the user
//   // let user = await getUserWithOauthId({
//   //   provider: "google",
//   //   email,
//   // });

//   // // if user exists but user is not linked with oauth
//   // if (user && !user.providerAccountId) {
//   //   await linkUserWithOauth({
//   //     userId: user.id,
//   //     provider: "google",
//   //     providerAccountId: googleUserId,
//   //     avatarUrl: picture,
//   //   });
//   // }

//   // // if user doesn't exist
//   // if (!user) {
//   //   user = await createUserWithOauth({
//   //     name,
//   //     email,
//   //     provider: "google",
//   //     providerAccountId: googleUserId,
//   //     avatarUrl: picture,
//   //   });
//   // }
//   // await authenticateUser({ req, res, user, name, email });

//   res.redirect("/");
// };
