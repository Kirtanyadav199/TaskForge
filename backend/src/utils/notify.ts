import { Notification, NotificationType } from "../models/notification.model";
import { Types } from "mongoose";

export const createNotification = async (
  userId: Types.ObjectId | string,
  type: NotificationType,
  message: string,
  relatedTaskId?: Types.ObjectId | string
) => {
  await Notification.create({ userId, type, message, relatedTaskId });
};