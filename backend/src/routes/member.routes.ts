import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { validate } from "../middlewares/validate";
import { addMemberSchema } from "../validators/member.validator";
import { addMember, getMembers } from "../controllers/member.controller";
import { updateMemberRoleSchema } from "../validators/member.validator";
import { updateMemberRole, removeMember } from "../controllers/member.controller";

const router = Router({ mergeParams: true });

router.post("/", authenticate, authorize("admin"), validate(addMemberSchema), addMember);
router.get("/", authenticate, authorize("member"), getMembers);


router.patch(
  "/:userId/role",
  authenticate,
  authorize("owner"),
  validate(updateMemberRoleSchema),
  updateMemberRole
);

router.delete("/:userId", authenticate, removeMember);

export default router;