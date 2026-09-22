import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { createOrganization } from "../controllers/organization.controller";

const router = Router();

router.post("/", authenticate, createOrganization);

router.get(
  "/:organizationId/admin-test",
  authenticate,
  authorize("admin"),
  (req, res) => {
    res.json({ success: true, message: "You have admin access!" });
  }
);

export default router;