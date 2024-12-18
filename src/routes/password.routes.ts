import { Router, Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import path from "path";
import bcrypt from "bcrypt";
import { randomInt } from "crypto";
import ejs from "ejs";
import Redis from "ioredis";
import jwt from "jsonwebtoken";

import { forgotPasswordSchema, resetPasswordSchema } from "../validator/passwordValidator";
import { passwordLimiter } from "../utils/rateLimit";
import { appError } from "../utils/appError";
import { formatZodErrors } from "../middlewares/globalError";
import { sendEmail } from "../utils/email/emailStore";
import { authMiddleware } from "../middlewares/authMiddleware";

const route = Router();
const redis = new Redis();
const prisma = new PrismaClient();

route.post('/forget-password', passwordLimiter, authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    const data = req.body;
    const payload = forgotPasswordSchema.safeParse(data);

    if( !payload.success ) {
        const zodError = formatZodErrors(payload.error);
        next(appError(422, "Validation error", zodError));
    };


    try {
        
    } catch (error) {
        return next(appError( 500, "Something went wrong while creating user"))
    }
});


export default route;