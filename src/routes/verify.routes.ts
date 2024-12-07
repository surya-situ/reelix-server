import { Router, Request, Response, NextFunction } from "express";

import { otpSchema } from "../validator/userValidator";
import { otpVerifyLimiter } from "../utils/rateLimit";

const router = Router();

router.post("/verify-otp", otpVerifyLimiter, async (req: Request, res: Response, next: NextFunction) => {
    const data = req.body;
    const payload = otpSchema.safeParse(data);
    const tempToken = req.headers['authorization']?.split(' ')[1];

    if(!tempToken) {
        res.status(429).json(
            {
                status: "Failed",
                message: "No token is provided"
            }
        );
    };


});

export default router;