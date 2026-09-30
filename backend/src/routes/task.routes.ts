import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { validate } from "../middlewares/validate";
import { createTaskSchema, updateTaskSchema } from "../validators/task.validator";
import { createTask, deleteTask, getTaskById, getTasks, updateTask } from "../controllers/task.controller";
import commentRoutes from "./comment.routes";
import { getTasksQuerySchema } from "../validators/task.validator";




const router = Router({ mergeParams: true });

router.post("/", authenticate, authorize("member"), validate(createTaskSchema), createTask);
router.get(
  "/",
  authenticate,
  authorize("member"),
  validate(getTasksQuerySchema, "query"),
  getTasks
);
router.patch("/:taskId", authenticate, authorize("member"), validate(updateTaskSchema), updateTask);


router.use("/:taskId/comments", commentRoutes);
router.get("/:taskId", authenticate, authorize("member"), getTaskById);
router.delete("/:taskId", authenticate, authorize("admin"), deleteTask);


export default router;