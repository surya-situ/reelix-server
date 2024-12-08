import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import { otpSchema } from "../validator/userValidator";
import { otpVerifyLimiter } from "../utils/rateLimit";
import { appError } from "../utils/appError";
import { formatZodErrors } from "../middlewares/globalError";
import Redis from "ioredis";
import { PrismaClient } from "@prisma/client";

const router = Router();
const redis = new Redis();
const prisma = new PrismaClient();

router.post("/verify-otp", otpVerifyLimiter, async (req: Request, res: Response, next: NextFunction) => {
    const data = req.body; // Get otp from the request body
    const payload = otpSchema.safeParse(data);
    const tempToken = req.headers['authorization']?.split(' ')[1];

    // - If the data isn't valid according to the schema, format the error and pass it to the appError middleware
    if( !payload.success ) {
        const zodError = formatZodErrors(payload.error);
        next(appError(422, "Validation error", zodError));
        return;
    };

    // - Check for missing token
    if( !tempToken ) {
        next(appError(401, "NO token is provided"));
        return;
    };

    try {
        if( !process.env.JWT_SECRET ) {
            throw new Error("No jwt secret is provided in the environment");
        };

        // - Decode the temporary token to get the user's email
        const decode = jwt.verify( tempToken, process.env.JWT_SECRET) as { email: string };
        const { otp }= payload.data;

        // - Get the OTP stored in Redis (for that specific user's email)
        const storedOtp = await redis.get(decode.email);

        // - Check for invalid or expired otp
        if (!storedOtp || storedOtp !== otp) {
            next(appError(401, "Invalid or expired OTP"));
            return;
        };

        // - Update user to mark as verified after OTP matched
        const user = await prisma.user.update(
            {
                where: {
                    email: decode.email
                },
                data: {
                    is_verified: true,
                    otp: null,
                    otp_expire_at: null
                }
            }
        );

        // - Delete otp from the redis queue
        await redis.del(decode.email);

        // - Permanent token for the user, valid for 7 days
        const permanentToken = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(200).json(
            {
                status: "Success",
                message: "OTP verified successfully, user signed in",
                token: permanentToken // Permanent token to use for user authentication
            }
        );
        return;

    } catch (error) {
        next(appError(500, "Something went wrong", error))
    }

});

export default router;