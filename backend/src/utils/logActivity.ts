import { Types } from "mongoose";
import { Activity, ActivityAction } from "../models/activity.model";
import { logger } from "../config/logger";

interface LogActivityParams {
  organizationId: string | Types.ObjectId;
  projectId?: string | Types.ObjectId;
  actorId: string | Types.ObjectId;
  action: ActivityAction;
  targetId?: string | Types.ObjectId;
  message: string;
}

export const logActivity = async (params: LogActivityParams): Promise<void> => {
  try {
    await Activity.create(params);
  } catch (error) {
   logger.error({ err: error }, "Failed to log activity");
  }
}