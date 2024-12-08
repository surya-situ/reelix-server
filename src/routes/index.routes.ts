import { Router } from "express";

import userRouter from "./user.routes";
import otpRouter from "./verify.routes";

const router = Router();

// - user routers
router.use( "/v1/api/user", userRouter );
router.use("/v1/api/verify-user-email", otpRouter);

export default router;