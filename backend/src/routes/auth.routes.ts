import { Router } from "express";
import { refresh, register } from "../controllers/auth.controller";
import { validate } from "../middlewares/validate";
import { registerSchema } from "../validators/auth.validator";
import { login } from "../controllers/auth.controller";
import { loginSchema } from "../validators/auth.validator";
import { logout } from "../controllers/auth.controller";
import { authLimiter } from "../middlewares/rateLimiter";

const router = Router();



router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/register", authLimiter, validate(registerSchema), register);
router.post("/refresh", refresh);
router.post("/logout", logout);
export default router;