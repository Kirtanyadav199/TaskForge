import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import { getNotifications, markAsRead } from "../controllers/notification.controller";

const router = Router();

router.get("/", authenticate, getNotifications);
router.patch("/:notificationId/read", authenticate, markAsRead);

export default router;