import { Router, Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import path from "path";
import bcrypt from "bcrypt";
import { randomInt } from "crypto";
import ejs from "ejs";
import Redis from "ioredis";

import { authLimiter } from "../utils/rateLimit";
import { signUpSchema } from "../validator/userValidator";
import { appError } from "../utils/appError";
import { sendEmail } from "../utils/email/emailStore";

const router = Router();
const prisma = new PrismaClient();
const redis = new Redis();

router.post('/signup', authLimiter, async ( req: Request, res: Response, next: NextFunction ) => {
    const data = req.body;
    const payload = signUpSchema.safeParse(data);

    if( !payload.success ) {
        res.status(422).json({
            message: "validation error"
        });
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
            res.status(422).json({
                message: "user already exists"
            })
            return;
        };

        // - Encrypt password;
        const encryptPassword = await bcrypt.hash(password, 10);

        // - OTP
        const otp = randomInt(100000, 999999).toString();
        const otpExpireTime = 5 * 60; // 5 minutes
        await redis.setex(email, otpExpireTime, otp);

        const templatePath = path.resolve(__dirname, "../views/welcome.ejs");
        const emailHtml = await ejs.renderFile(templatePath, { name, otp });

        // - Send email with OTP
        try {
            await sendEmail(email, "Email Verification OTP", emailHtml);
        } catch (emailError) {
            console.error("Error sending email:", emailError);
            return next(appError(500, "Failed to send email"));
        };

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
                data: newUser
            }
        );
        return;

    } catch (error) {
        console.error("Error during signup:", error);
        return next(appError( 500, "Something went wrong while creating user"))
    }
});

export default router;