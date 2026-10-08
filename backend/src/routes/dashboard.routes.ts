import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { getDashboardStats } from "../controllers/dashboard.controller";

const router = Router({ mergeParams: true });

router.get("/", authenticate, authorize("member"), getDashboardStats);

export default router;