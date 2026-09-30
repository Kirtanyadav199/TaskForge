import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { validate } from "../middlewares/validate";
import { createCommentSchema } from "../validators/comment.validator";
import { createComment, deleteComment, getComments, updateComment } from "../controllers/comment.controller";


const router = Router({ mergeParams: true });

router.post("/", authenticate, authorize("member"), validate(createCommentSchema), createComment);
router.get("/", authenticate, authorize("member"), getComments);
router.patch("/:commentId", authenticate, authorize("member"), updateComment);
router.delete("/:commentId", authenticate, authorize("member"), deleteComment);

export default router;