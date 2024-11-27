import { Router, Request, Response } from "express";

import { authLimiter } from "../utils/rateLimit";

const router = Router();

router.post('/signup', authLimiter, ( req: Request, res: Response ) => {
    
});

export default router;