import { Request, Response, NextFunction } from "express";
import { Comment } from "../models/comment.model";
import { CreateCommentInput } from "../validators/comment.validator";

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