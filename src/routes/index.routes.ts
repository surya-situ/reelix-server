import { Router } from "express";

import userRouter from "./user.routes";

const router = Router();

// - user routers
router.use( "/v1/api/user", userRouter );

export default router;