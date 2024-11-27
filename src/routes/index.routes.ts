import { Router } from "express";

import authRouter from "../routes/auth.routes";

const router = Router();

// - user routers
router.use( "/v1/api/auth", authRouter );

export default router;