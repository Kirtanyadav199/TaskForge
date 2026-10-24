import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { validate } from "../middlewares/validate";
import { getActivityQuerySchema } from "../validators/activity.validator";
import { getActivity } from "../controllers/activity.controller";

const router = Router({ mergeParams: true });

router.get(
  "/",
  authenticate,
  authorize("member"),
  validate(getActivityQuerySchema, "query"),
  getActivity
);

export default router;