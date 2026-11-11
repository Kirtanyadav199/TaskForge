import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { Comment } from "../models/comment.model";
import { Task } from "../models/task.model";
import { AppError } from "../utils/AppError";
import { createNotification } from "../utils/notify";
import { CreateCommentInput } from "../validators/comment.validator";

type TaskScope = { organizationId: string; projectId: string; taskId: string };

// The task must belong to BOTH the org and project in the URL.
const findTaskInScope = async ({ organizationId, projectId, taskId }: TaskScope) => {
  const task = await Task.findOne({ _id: taskId, organizationId, projectId });
  if (!task) {
    throw new AppError("Task not found", 404);
  }
  return task;
};

export const createComment = async (
  req: Request<TaskScope, {}, CreateCommentInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const task = await findTaskInScope(req.params);

    const comment = await Comment.create({
      content: req.body.content,
      taskId: task._id,
      userId,
    });

    if (task.createdBy.toString() !== userId) {
      await createNotification(
        task.createdBy,
        "NEW_COMMENT",
        `New comment on task: "${task.title}"`,
        task._id as Types.ObjectId
      );
    }

    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    next(error);
  }
};

export const getComments = async (
  req: Request<TaskScope>,
  res: Response,
  next: NextFunction
) => {
  try {
    const task = await findTaskInScope(req.params);

    const comments = await Comment.find({ taskId: task._id })
      .populate("userId", "name email")
      .sort({ createdAt: 1 });

    res.status(200).json({ success: true, data: comments });
  } catch (error) {
    next(error);
  }
};

export const updateComment = async (
  req: Request<TaskScope & { commentId: string }, {}, CreateCommentInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const task = await findTaskInScope(req.params);

    const comment = await Comment.findOneAndUpdate(
      { _id: req.params.commentId, taskId: task._id, userId },
      { $set: { content: req.body.content } },
      { returnDocument: "after", runValidators: true }
    );

    if (!comment) {
      throw new AppError("Comment not found or you are not the author", 404);
    }

    res.status(200).json({ success: true, data: comment });
  } catch (error) {
    next(error);
  }
};

export const deleteComment = async (
  req: Request<TaskScope & { commentId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const task = await findTaskInScope(req.params);

    const comment = await Comment.findOneAndDelete({
      _id: req.params.commentId,
      taskId: task._id,
      userId,
    });

    if (!comment) {
      throw new AppError("Comment not found or you are not the author", 404);
    }

    res.status(200).json({ success: true, message: "Comment deleted" });
  } catch (error) {
    next(error);
  }
};