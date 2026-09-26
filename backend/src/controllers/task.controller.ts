import { Request, Response, NextFunction } from "express";
import { Task } from "../models/task.model";
import { CreateTaskInput, UpdateTaskInput } from "../validators/task.validator";
import { AppError } from "../utils/AppError";

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

    const tasks = await Task.find({ projectId }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: tasks });
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