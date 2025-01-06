import rateLimit from "express-rate-limit";

const commonRateLimitingConfig = {
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 429,
        error: "Too many requests, please try again after some time."
    }
};

export const appLimiter = rateLimit(
    {
        windowMs: 10 * 60 * 1000,
        limit: 200,
        ...commonRateLimitingConfig
    }
);

export const authLimiter = rateLimit(
    {
        windowMs: 10 * 60 * 1000,
        limit: 10,
        ...commonRateLimitingConfig
    }
);

export const passwordLimiter = rateLimit(
    {
        windowMs: 5 * 60 * 1000,
        limit: 3,
        ...commonRateLimitingConfig
    }
);

export const otpVerifyLimiter = rateLimit(
    {
        windowMs: 5 * 60 * 1000,
        limit: 5,
        ...commonRateLimitingConfig
    }
);

export const reelixBattleLimiter = rateLimit(
    {
        windowMs: 5 * 60 * 1000,
        limit: 3,
        ...commonRateLimitingConfig
    }
);