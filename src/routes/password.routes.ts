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

route.post('/forget-password', passwordLimiter, async (req: Request, res: Response, next: NextFunction) => {
    const data = req.body;
    const payload = forgotPasswordSchema.safeParse(data);

    if( !payload.success ) {
        const zodError = formatZodErrors(payload.error);
        next(appError(422, "Validation error", zodError));
        return;
    };

    try {
        const  { email }  = payload.data;

        let findUser = await prisma.user.findUnique(
            {
                where: {
                    email
                }
            }
        );
   
        if( !findUser ) {
            next(appError(401, `User with email ${email} not found`));
            return;
        };
        const { name } = findUser;

        const otp = randomInt(100000, 999999).toString();
        const passwordResetOtpExpireAt = 5 * 60;

        await redis.setex(email, passwordResetOtpExpireAt, otp);

        // - Rendering ejs for email
        const templatePath = path.resolve(__dirname, "../views/password.ejs");
        const emailHtml = await ejs.renderFile(templatePath, { name, otp });

        // - Generating a temporary JWT token to allow further user's verification
        const tempToken = jwt.sign(
            { email },
            process.env.JWT_SECRET!,
            { expiresIn: "5m" }
        );

        // - Attempt to send the password reset OTP email to the user
        try {
            await sendEmail(email, "Email Verification OTP", emailHtml);
        } catch (emailError) {
            next(appError(500, "Failed to send email", emailError));
            return;
        };

        const updateUserData = await prisma.user.update(
            {
                where: {
                    email
                },
                data: {
                    password_reset_otp: otp,
                    reset_otp_expire_at: new Date(Date.now() + passwordResetOtpExpireAt * 1000)
                }
            }
        );

        res.status(200).json(
            {
                status: "success",
                message: "Password reset OTP sent to email",
                data: updateUserData,
                token: tempToken
            }
        );
        return;

    } catch (error) {
        next(appError( 500, "Something went wrong."));
        return;
    };
});


export default route;