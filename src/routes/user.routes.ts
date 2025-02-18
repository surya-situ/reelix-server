import { Router, Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import path from "path";
import bcrypt from "bcrypt";
import { randomInt } from "crypto";
import ejs from "ejs";
import Redis from "ioredis";
import jwt from "jsonwebtoken";
import cron from "node-cron";

import { authLimiter } from "../utils/rateLimit";
import { signinSchema, signUpSchema } from "../validator/userValidator";
import { appError } from "../utils/appError";
import { formatZodErrors } from "../middlewares/globalError";
import { sendEmail } from "../utils/email/emailStore";
import { authMiddleware } from "../middlewares/authMiddleware";

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

        // - Generating a temporary JWT token to allow further user's email verification
        const tempToken = jwt.sign(
            { email },
            process.env.JWT_SECRET!,
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
        await prisma.user.create(
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
                token: tempToken as string // Jwt token for user email verification in verify route
            }
        );
        return;

    } catch (error) {
        console.error("Error during signup:", error);
        return next(appError( 500, "Something went wrong while creating user"))
    }
});

// - SIGN IN route:
router.post('/signin', authLimiter, async ( req: Request, res: Response, next: NextFunction ) => {
    const data = req.body;
    const payload = signinSchema.safeParse(data);

    // If validation fails, format Zod errors and send a validation error response
    if( !payload.success ) {
        const zodError = formatZodErrors(payload.error);
        next(appError(422, "validation error", zodError));
        return;
    };

    try {
        const { email, password } = payload.data;

        // Check if the user exists in the database using the email
        let existingUser = await prisma.user.findUnique(
            {
                where: {
                    email
                }
            }
        );

        if( !existingUser ) {
            next(appError(404, 'User does not exists'));
            return;
        };

        const comparePassword = await bcrypt.compare(password, existingUser.password);

        if( !comparePassword ) {
            next(appError(422, "Invalid email or password"));
            return;
        };

        // Generate a JWT token with the user's ID and a 7-day expiry
        const permanentToken = jwt.sign(
            { userId: existingUser.id },
            process.env.JWT_SECRET!,
            { expiresIn: "7d" }
        );

        res.status(200).json(
            {
                status: "Success",
                message: "User sign in successfully",
                token: permanentToken as string // Permanent token to use for user authentication
            }
        );
        return;

    } catch (error) {
        next(appError(500, "Something went wrong", error));
        return;
    }
});

// - GET USER DETAILS route:
router.get('/getUserData', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Extract userId from the token
        const userId = (req.user as { userId: string }).userId;

        // Fetch user data from the database using Prisma
        const user = await prisma.user.findUnique({
            where: {
                id: userId,
            },
            select: {
                name: true,
                email: true,
            },
        });

        // If user not found, return an error
        if (!user) {
            return next(appError(404, "User not found"));
        }

        // Respond with user data
        res.status(200).json({
            status: "success",
            data: user,
        });
    } catch (error) {
        console.error("Error fetching user data:", error);
        return next(appError(500, "Something went wrong while fetching user data"));
    }
});

// - DELETE route:
router.delete("/delete-account",authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    // Extract userId from the token
    const userId = (req.user as { userId: string }).userId;

    if (!userId) {
        next(appError(401, "Unauthorized"));
        return;
    }

    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user) {
            next(appError(404, "User not found"));
        }

        if (user!.delete_at) {
            next(appError(400, "Account deletion not scheduled"));
            return;
        }

        const currentDate = new Date();
        const deleteAt = new Date(user!.delete_at!);

        if (currentDate.toISOString().split("T")[0] >= deleteAt.toISOString().split("T")[0]) {
            await prisma.user.delete({ where: { id: userId } });
            res.status(200).json({ status: "success", message: "Account deleted successfully." });
            return;
        } else {
            next(appError(400, "Account deletion scheduled for a later date"));
            return;
        }
    } catch (error) {
        console.error("Error during account deletion:", error);
        next(appError(500, "Something went wrong while deleting account"));
    }
});



export default router;