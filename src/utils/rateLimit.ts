import rateLimit from "express-rate-limit";

export const appLimiter = rateLimit(
    {
        windowMs: 10 * 60 * 1000,
        limit: 200,
        standardHeaders: 'draft-7',
        legacyHeaders: false
    }
);

export const authLimiter = rateLimit(
    {
        windowMs: 10 * 60 * 1000,
        limit: 20,
        standardHeaders: 'draft-7',
        legacyHeaders: false
    }
);