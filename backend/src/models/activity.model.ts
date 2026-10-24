import mongoose, { Document, Schema, Types } from "mongoose";

export type ActivityAction =
  | "TASK_CREATED"
  | "TASK_UPDATED"
  | "TASK_STATUS_CHANGED"
  | "TASK_ASSIGNED"
  | "TASK_DELETED"
  | "PROJECT_CREATED"
  | "PROJECT_DELETED"
  | "MEMBER_ADDED"
  | "MEMBER_REMOVED"
  | "MEMBER_ROLE_CHANGED";

export interface IActivity extends Document {
  organizationId: Types.ObjectId;
  projectId?: Types.ObjectId;
  actorId: Types.ObjectId;
  action: ActivityAction;
  targetId?: Types.ObjectId;
  message: string;
  createdAt: Date;
}

const activitySchema = new Schema<IActivity>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project" },
    actorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true },
    targetId: { type: Schema.Types.ObjectId },
    message: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

activitySchema.index({ organizationId: 1, createdAt: -1 });

export const Activity = mongoose.model<IActivity>("Activity", activitySchema);