import jwt from 'jsonwebtoken';

interface TokenPayload {
  userId: string;
  email: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  const accessTokenSecret = process.env.JWT_ACCESS_SECRET || 'access-secret-key';
  
  return jwt.sign(payload, accessTokenSecret, {
    expiresIn: '15m', // Access token expires in 15 minutes
  });
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  const refreshTokenSecret = process.env.JWT_REFRESH_SECRET || 'refresh-secret-key';
  
  return jwt.sign(payload, refreshTokenSecret, {
    expiresIn: '7d', // Refresh token expires in 7 days
  });
};

export const generateTokenPair = (payload: TokenPayload): TokenPair => {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};

export const verifyAccessToken = (token: string): TokenPayload => {
  const accessTokenSecret = process.env.JWT_ACCESS_SECRET || 'access-secret-key';
  return jwt.verify(token, accessTokenSecret) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  const refreshTokenSecret = process.env.JWT_REFRESH_SECRET || 'refresh-secret-key';
  return jwt.verify(token, refreshTokenSecret) as TokenPayload;
};

