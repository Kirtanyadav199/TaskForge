import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { createOrganization, deleteOrganization, getOrganizations, updateOrganization } from "../controllers/organization.controller";
import projectRoutes from "./project.routes";
import memberRoutes from "./member.routes"; 


const router = Router();

router.post("/", authenticate, createOrganization);

router.use("/:organizationId/projects", projectRoutes);

router.use("/:organizationId/members", memberRoutes);

router.get("/", authenticate, getOrganizations);
router.patch("/:organizationId", authenticate, authorize("owner"), updateOrganization);
router.delete("/:organizationId", authenticate, authorize("owner"), deleteOrganization);
export default router;