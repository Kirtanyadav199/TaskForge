import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { validate } from "../middlewares/validate";
import { createProjectSchema } from "../validators/project.validator";
import { createProject, getProjects } from "../controllers/project.controller";
import taskRoutes from "./task.routes";

const router = Router({ mergeParams: true });

router.post(
  "/",
  authenticate,
  authorize("member"),
  validate(createProjectSchema),
  createProject
);

router.get("/", authenticate, authorize("member"), getProjects);
router.use("/:projectId/tasks", taskRoutes);

export default router;