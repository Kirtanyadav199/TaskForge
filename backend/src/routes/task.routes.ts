import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { validate } from "../middlewares/validate";
import { createTaskSchema, updateTaskSchema } from "../validators/task.validator";
import { createTask, getTasks, updateTask } from "../controllers/task.controller";

const router = Router({ mergeParams: true });

router.post("/", authenticate, authorize("member"), validate(createTaskSchema), createTask);
router.get("/", authenticate, authorize("member"), getTasks);
router.patch("/:taskId", authenticate, authorize("member"), validate(updateTaskSchema), updateTask);

export default router;