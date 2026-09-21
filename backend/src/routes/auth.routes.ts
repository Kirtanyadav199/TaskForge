import { Router } from "express";
import { register } from "../controllers/auth.controller";
import { validate } from "../middlewares/validate";
import { registerSchema } from "../validators/auth.validator";
import { login } from "../controllers/auth.controller";
import { loginSchema } from "../validators/auth.validator";

const router = Router();



router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);

export default router;