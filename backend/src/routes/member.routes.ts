import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { validate } from "../middlewares/validate";
import { addMemberSchema } from "../validators/member.validator";
import { addMember, getMembers } from "../controllers/member.controller";

const router = Router({ mergeParams: true });

router.post("/", authenticate, authorize("admin"), validate(addMemberSchema), addMember);
router.get("/", authenticate, authorize("member"), getMembers);

export default router;