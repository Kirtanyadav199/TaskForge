import { Request, Response, NextFunction } from "express";
import { Task } from "../models/task.model";
import { CreateTaskInput, UpdateTaskInput } from "../validators/task.validator";
import { AppError } from "../utils/AppError";
import { GetTasksQuery } from "../validators/task.validator";

export const createTask = async (
  req: Request<{ organizationId: string; projectId: string }, {}, CreateTaskInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { organizationId, projectId } = req.params;
    const userId = req.user!.userId;

    const task = await Task.create({
      ...req.body,
      projectId,
      organizationId,
      createdBy: userId,
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
    const { projectId } = req.params;
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

    const filter: Record<string, any> = { projectId };

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

export const updateTask = async (
  req: Request<{ organizationId: string; projectId: string; taskId: string }, {}, UpdateTaskInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findByIdAndUpdate(
      taskId,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!task) {
      throw new AppError("Task not found", 404);
    }

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};