import { Request, Response, NextFunction } from "express";
import { Comment } from "../models/comment.model";
import { CreateCommentInput } from "../validators/comment.validator";
import { Task } from "../models/task.model";
import { createNotification } from "../utils/notify";
import { Types } from "mongoose";
import { AppError } from "../utils/AppError";

export const createComment = async (
  req: Request<{ taskId: string }, {}, CreateCommentInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { taskId } = req.params;
    const { content } = req.body;
    const userId = req.user!.userId;

    const comment = await Comment.create({ content, taskId, userId });

    const task = await Task.findById(taskId);
    if (task && task.createdBy.toString() !== userId) {
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
  req: Request<{ taskId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { taskId } = req.params;

    const comments = await Comment.find({ taskId })
      .populate("userId", "name email")
      .sort({ createdAt: 1 });

    res.status(200).json({ success: true, data: comments });
  } catch (error) {
    next(error);
  }
};

export const updateComment = async (
  req: Request<{ taskId: string; commentId: string }, {}, { content: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { taskId, commentId } = req.params;
    const userId = req.user!.userId;

    const comment = await Comment.findOneAndUpdate(
      { _id: commentId, taskId, userId },
      { $set: { content: req.body.content } },
      { new: true, runValidators: true }
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
  req: Request<{ taskId: string; commentId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { taskId, commentId } = req.params;
    const userId = req.user!.userId;

    const comment = await Comment.findOneAndDelete({ _id: commentId, taskId, userId });

    if (!comment) {
      throw new AppError("Comment not found or you are not the author", 404);
    }

    res.status(200).json({ success: true, message: "Comment deleted" });
  } catch (error) {
    next(error);
  }
};