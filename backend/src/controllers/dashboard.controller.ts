import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { Task } from "../models/task.model";

export const getDashboardStats = async (
  req: Request<{ organizationId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { organizationId } = req.params;
    const userId = req.user!.userId;
    const orgObjectId = new mongoose.Types.ObjectId(organizationId);

    const [statusCounts, myTasksCount, overdueCount] = await Promise.all([
      Task.aggregate([
        { $match: { organizationId: orgObjectId } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),

      Task.countDocuments({
        organizationId,
        assigneeId: userId,
        status: { $ne: "DONE" },
      }),

      Task.countDocuments({
        organizationId,
        dueDate: { $lt: new Date() },
        status: { $ne: "DONE" },
      }),
    ]);

    const totalTasks = statusCounts.reduce((sum, s) => sum + s.count, 0);
    const completedTasks =
      statusCounts.find((s) => s._id === "DONE")?.count || 0;

    res.status(200).json({
      success: true,
      data: {
        totalTasks,
        completedTasks,
        pendingTasks: totalTasks - completedTasks,
        myAssignedTasks: myTasksCount,
        overdueTasks: overdueCount,
        breakdown: statusCounts,
      },
    });
  } catch (error) {
    next(error);
  }
};