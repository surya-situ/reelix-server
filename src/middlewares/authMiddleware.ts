import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { appError } from "../utils/appError";

export const authMiddleware = ( req: Request, res: Response, next: NextFunction ) => {
    const token = req.headers.authorization?.split(' ')[1];

    if(!token) {
        next(appError(400, "Access denied!"));
        return;
    };

    try {
        const verifyToken = jwt.verify(token, process.env.JWT_SECRET!);
        req.user = verifyToken
        next();
    } catch (error) {
        next(appError(400, 'Invalid token'));
        return;
    };
};