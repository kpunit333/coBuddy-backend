import jwt from 'jsonwebtoken';
import { ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY } from '../config/constants';
import { env } from '../config/env';

interface TokenPayload {
  userId: string;
  emailId: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export const generateToken = (payload: TokenPayload, duration: number): string => {
  const tokenSecret = env.JWT_SECRET_KEY!;
  
  return jwt.sign(payload, tokenSecret, {
    expiresIn: duration,
  });
};

export const generateAccessToken = (payload: TokenPayload): string => {
  const accessToken = generateToken(payload, ACCESS_TOKEN_EXPIRY);  
  return accessToken;
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  const refreshToken = generateToken(payload, REFRESH_TOKEN_EXPIRY);  
  return refreshToken;
};

export const verifyAccessToken = (token: string): TokenPayload => {
  const tokenSecret = env.JWT_SECRET_KEY!;
  return jwt.verify(token, tokenSecret) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  const tokenSecret = env.JWT_SECRET_KEY!;
  return jwt.verify(token, tokenSecret) as TokenPayload;
};

export const generateTokenPair = (payload: TokenPayload): TokenPair => {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};
