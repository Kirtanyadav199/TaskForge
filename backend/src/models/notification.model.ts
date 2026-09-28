import mongoose, { Document, Schema, Types } from "mongoose";

export type NotificationType = "TASK_ASSIGNED" | "NEW_COMMENT";

export interface INotification extends Document {
  userId: Types.ObjectId;
  type: NotificationType;
  message: string;
  relatedTaskId?: Types.ObjectId;
  isRead: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["TASK_ASSIGNED", "NEW_COMMENT"],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    relatedTaskId: {
      type: Schema.Types.ObjectId,
      ref: "Task",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>(
  "Notification",
  notificationSchema
);