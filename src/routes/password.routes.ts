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

const route = Router();
const redis = new Redis();
const prisma = new PrismaClient();

route.post('/forget-password', passwordLimiter, async (req: Request, res: Response, next: NextFunction) => {
    const data = req.body;
    const payload = forgotPasswordSchema.safeParse(data);

    // - If the data isn't valid according to the schema, format the error and pass it to the appError middleware
    if( !payload.success ) {
        const zodError = formatZodErrors(payload.error);
        next(appError(422, "Validation error", zodError));
        return;
    };

    try {
        const  { email }  = payload.data;

        // - Find the user form the email
        let findUser = await prisma.user.findUnique(
            {
                where: {
                    email
                }
            }
        );
   
        // - Check for user exists or not
        if( !findUser ) {
            next(appError(401, `User with email ${email} not found`));
            return;
        };

        // - Extract the name form the user to send in the email as greetings
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
            await sendEmail(email, "Reset password OTP", emailHtml);
        } catch (emailError) {
            next(appError(500, "Failed to send email", emailError));
            return;
        };

        // - Updating user's password otp and expire time
        await prisma.user.update(
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
                token: tempToken as string
            }
        );
        return;

    } catch (error) {
        next(appError( 500, "Something went wrong."));
        return;
    };
});


route.post('/reset-password', passwordLimiter, async (req: Request, res: Response, next: NextFunction) => {
    const data = req.body;
    const payload = resetPasswordSchema.safeParse(data);
    const tempToken = req.headers['authorization']?.split(' ')[1];

    // - If the data isn't valid according to the schema, format the error and pass it to the appError middleware
    if( !payload.success ) {
        const zodError = formatZodErrors(payload.error);
        next(appError(422, "Validation error", zodError));
        return;
    };
    
    // - Check for missing token
    if ( !tempToken ) {
        next(appError(422, "No token is provided"));
        return;
    };

    try {
        // - Decode the temporary token to get the user's email
        const decode = jwt.verify( tempToken, process.env.JWT_SECRET!) as { email: string };

        const { otp, password } = payload.data;

        // - Encrypt password;
        const encryptPassword = await bcrypt.hash(password, 10);

        // - Get the OTP stored in the Redis
        const storedOtp = await redis.get( decode.email );

        // - Check for invalid or expired OTP
        if( !storedOtp || storedOtp !== otp ) {
            next(appError(401, "Invalid or expired OTP"));
        };

        // - Update user password and reset password related otp expire to null
        await prisma.user.update(
            {
                where: {
                    email: decode.email
                },
                data: {
                    password: encryptPassword,
                    password_reset_otp: null,
                    reset_otp_expire_at: null
                }
            }
        );

        // - Delete otp from the redis queue
        await redis.del(decode.email);

        res.status(200).json(
            {
                status: "Success",
                message: "Password update successfully"
            }
        );
        return;

    } catch (error) {
        next(appError( 500, "Something went wrong."));
        return;
    }
});

export default route;