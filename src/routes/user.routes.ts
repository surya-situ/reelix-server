import { Router, Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import path from "path";
import bcrypt from "bcrypt";
import { randomInt } from "crypto";
import ejs from "ejs";
import Redis from "ioredis";
import jwt from "jsonwebtoken";

import { authLimiter } from "../utils/rateLimit";
import { signUpSchema } from "../validator/userValidator";
import { appError } from "../utils/appError";
import { formatZodErrors } from "../middlewares/globalError";
import { sendEmail } from "../utils/email/emailStore";

const router = Router();
const prisma = new PrismaClient();
const redis = new Redis();

// - SIGN UP route: 
router.post('/signup', authLimiter, async ( req: Request, res: Response, next: NextFunction ) => {
    const data = req.body;

    // Validating the incoming data using Zod schema
    const payload = signUpSchema.safeParse(data);

    if( !payload.success ) {
        const zodError = formatZodErrors(payload.error)
        next(appError(422, "validation error", zodError))
        return 
    };

    try {
        const {name, email, password} = payload.data;

        let existingUser = await prisma.user.findUnique(
            { 
                where: {
                    email
                }
            }
        );

        if( existingUser ) {
            next(appError(422, "User already exists"));
            return;
        };

        // - Encrypt password;
        const encryptPassword = await bcrypt.hash(password, 10);

        // - OTP ( one-time password ) for email verification
        const otp = randomInt(100000, 999999).toString();
        const otpExpireTime = 5 * 60; // OTP expiration time in seconds (5 minutes)

        // - Store the OTP in Redis with an expiration time
        await redis.setex(email, otpExpireTime, otp);

        // - Rendering ejs for email
        const templatePath = path.resolve(__dirname, "../views/welcome.ejs");
        const emailHtml = await ejs.renderFile(templatePath, { name, otp });

        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is not defined in environment variables.");
        }

        // - Generating a temporary JWT token to allow further user's email verification
        const tempToken = jwt.sign(
            { email },
            process.env.JWT_SECRET,
            { expiresIn: "5m" }
        );

        // - Attempt to send the OTP email to the user
        try {
            await sendEmail(email, "Email Verification OTP", emailHtml);
        } catch (emailError) {
            console.error("Error sending email:", emailError);
            return next(appError(500, "Failed to send email"));
        };

        // - Creating new user in the db
        const newUser = await prisma.user.create(
            {
                data: {
                    name,
                    email,
                    password: encryptPassword,
                    otp: otp,
                    otp_expire_at: new Date(Date.now() + otpExpireTime * 1000)
                }
            }
        );

        res.status(200).json(
            {
                status: "success",
                message: "User created and OTP sent to email",
                data: newUser, // User data
                token: tempToken as string // Jwt token for user email verification in verify route
            }
        );
        return;

    } catch (error) {
        console.error("Error during signup:", error);
        return next(appError( 500, "Something went wrong while creating user"))
    }
});

export default router;