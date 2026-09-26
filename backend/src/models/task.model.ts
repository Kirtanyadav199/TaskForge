import mongoose, { Document, Schema, Types } from "mongoose";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface ITask extends Document {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: Types.ObjectId;
  organizationId: Types.ObjectId;
  assigneeId?: Types.ObjectId;
  createdBy: Types.ObjectId;
  dueDate?: Date;
  labels: string[];
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["TODO", "IN_PROGRESS", "REVIEW", "DONE"],
      default: "TODO",
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
      default: "MEDIUM",
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    assigneeId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    dueDate: {
      type: Date,
    },
    labels: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

taskSchema.index({ projectId: 1, status: 1 });
taskSchema.index({ assigneeId: 1 });

export const Task = mongoose.model<ITask>("Task", taskSchema);