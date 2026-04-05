import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/token-generator.ts';
import { ResponseBody } from '../utils/response.ts';

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    
    const authHeader: string | undefined = req.headers['authorization'] as string | undefined;
    const token = authHeader?.split(' ')?.[1]; // Bearer TOKEN
    let response = new ResponseBody();

    if (!token) {
        response.setMessage('Access token required');
        res.status(401).json(response);
        return;
    }

    try {

        const payload = verifyAccessToken(token);
        (req as any).user = payload;
        next();

    } catch (error: any) {
        response.setMessage(error.message || 'Invalid token');
        res.status(401).json(response);
        return;
    }

};

