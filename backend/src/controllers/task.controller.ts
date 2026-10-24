import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { Task } from "../models/task.model";
import { OrganizationMember } from "../models/organizationMember.model";
import { AppError } from "../utils/AppError";
import { createNotification } from "../utils/notify";
import { CreateTaskInput, UpdateTaskInput, GetTasksQuery } from "../validators/task.validator";
import { logActivity } from "../utils/logActivity";

const assertAssigneeIsMember = async (
  assigneeId: string,
  organizationId: string
) => {
  if (!mongoose.Types.ObjectId.isValid(assigneeId)) {
    throw new AppError("Invalid assignee ID", 400);
  }

  const isMember = await OrganizationMember.exists({
    userId: assigneeId,
    organizationId,
  });

  if (!isMember) {
    throw new AppError("Assignee must be a member of this organization", 400);
  }
};

export const createTask = async (
  req: Request<{ organizationId: string; projectId: string }, {}, CreateTaskInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { organizationId, projectId } = req.params;
    const userId = req.user!.userId;

    if (req.body.assigneeId) {
      await assertAssigneeIsMember(req.body.assigneeId, organizationId);
    }

    const task = await Task.create({
      ...req.body,
      projectId,
      organizationId,
      createdBy: userId,
    });

    await logActivity({
  organizationId,
  projectId,
  actorId: userId,
  action: "TASK_CREATED",
  targetId: task._id as mongoose.Types.ObjectId,
  message: `created task "${task.title}"`,
});

    res.status(201).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

export const getTasks = async (
  req: Request<{ organizationId: string; projectId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { organizationId, projectId } = req.params;
    const {
      status,
      priority,
      assigneeId,
      search,
      page,
      limit,
      sortBy,
      sortOrder,
    } = req.query as unknown as GetTasksQuery;

    const filter: Record<string, any> = { projectId, organizationId };

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assigneeId) filter.assigneeId = assigneeId;
    if (search) filter.title = { $regex: search, $options: "i" };

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const [tasks, totalCount] = await Promise.all([
      Task.find(filter).sort(sort).skip(skip).limit(limit),
      Task.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: tasks,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getTaskById = async (
  req: Request<{ organizationId: string; projectId: string; taskId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { organizationId, projectId, taskId } = req.params;

    const task = await Task.findOne({ _id: taskId, organizationId, projectId });

    if (!task) {
      throw new AppError("Task not found", 404);
    }

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (
  req: Request<{ organizationId: string; projectId: string; taskId: string }, {}, UpdateTaskInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { organizationId, projectId, taskId } = req.params;
    const userId = req.user!.userId;

    const existingTask = await Task.findOne({ _id: taskId, organizationId, projectId });
    if (!existingTask) {
      throw new AppError("Task not found", 404);
    }

    if (req.body.assigneeId) {
      await assertAssigneeIsMember(req.body.assigneeId, organizationId);
    }

    const isNewAssignment =
      req.body.assigneeId &&
      req.body.assigneeId !== existingTask.assigneeId?.toString();

    const task = await Task.findByIdAndUpdate(
      taskId,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (isNewAssignment && task) {
      await createNotification(
        req.body.assigneeId!,
        "TASK_ASSIGNED",
        `You have been assigned to task: "${task.title}"`,
        task._id as mongoose.Types.ObjectId
      );
    }

    if (task) {
  const statusChanged =
    req.body.status && req.body.status !== existingTask.status;

  if (statusChanged) {
    await logActivity({
      organizationId,
      projectId,
      actorId: userId,
      action: "TASK_STATUS_CHANGED",
      targetId: task._id as mongoose.Types.ObjectId,
      message: `moved "${task.title}" from ${existingTask.status} to ${task.status}`,
    });
  }

  if (isNewAssignment) {
    await logActivity({
      organizationId,
      projectId,
      actorId: userId,
      action: "TASK_ASSIGNED",
      targetId: task._id as mongoose.Types.ObjectId,
      message: `assigned "${task.title}" to a team member`,
    });
  }

  if (!statusChanged && !isNewAssignment) {
    await logActivity({
      organizationId,
      projectId,
      actorId: userId,
      action: "TASK_UPDATED",
      targetId: task._id as mongoose.Types.ObjectId,
      message: `updated task "${task.title}"`,
    });
  }
}

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (
  req: Request<{ organizationId: string; projectId: string; taskId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { organizationId, projectId, taskId } = req.params;

    const task = await Task.findOneAndDelete({ _id: taskId, organizationId, projectId });

    if (!task) {
      throw new AppError("Task not found", 404);
    }

    await logActivity({
  organizationId,
  projectId,
  actorId: req.user!.userId,
  action: "TASK_DELETED",
  message: `deleted task "${task.title}"`,
});

    res.status(200).json({ success: true, message: "Task deleted" });
  } catch (error) {
    next(error);
  }
};