import { Request, Response, NextFunction } from "express";
import { Notification } from "../models/notification.model";

export const getNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (
  req: Request<{ notificationId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user!.userId;

    await Notification.updateOne(
      { _id: notificationId, userId },
      { isRead: true }
    );

    res.status(200).json({ success: true, message: "Marked as read" });
  } catch (error) {
    next(error);
  }
};