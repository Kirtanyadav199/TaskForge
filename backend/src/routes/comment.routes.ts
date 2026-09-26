import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { validate } from "../middlewares/validate";
import { createCommentSchema } from "../validators/comment.validator";
import { createComment, getComments } from "../controllers/comment.controller";

const router = Router({ mergeParams: true });

router.post("/", authenticate, authorize("member"), validate(createCommentSchema), createComment);
router.get("/", authenticate, authorize("member"), getComments);

export default router;