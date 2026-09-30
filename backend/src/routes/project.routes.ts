import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { validate } from "../middlewares/validate";
import { createProjectSchema, updateProjectSchema } from "../validators/project.validator";
import { createProject, deleteProject, getProjectById, getProjects, updateProject } from "../controllers/project.controller";
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
router.get("/:projectId", authenticate, authorize("member"), getProjectById);
router.patch("/:projectId", authenticate, authorize("admin"), validate(updateProjectSchema), updateProject);
router.delete("/:projectId", authenticate, authorize("admin"), deleteProject);
export default router;