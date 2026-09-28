import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { createOrganization } from "../controllers/organization.controller";
import projectRoutes from "./project.routes";
import memberRoutes from "./member.routes"; 

const router = Router();

router.post("/", authenticate, createOrganization);

router.use("/:organizationId/projects", projectRoutes);

router.use("/:organizationId/members", memberRoutes);

export default router;