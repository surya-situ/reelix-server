import { Router, Request, Response } from "express";

import { authLimiter } from "../utils/rateLimit";

const route = Router();

route.post('/signup', authLimiter, ( req: Request, res: Response ) => {
    
});