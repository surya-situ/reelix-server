import { Router } from "express";

import userRouter from "./user.routes";
import otpRouter from "./verify.routes";
import videoRouter from "./reelix.routes";

const router = Router();

// - user route
router.use( "/v1/api/user", userRouter );
router.use("/v1/api/verify-user-email", otpRouter);

// - videos route
router.use("/v2/api/videos", videoRouter);

export default router;