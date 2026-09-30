import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { AppError } from "../utils/AppError";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({
      success: false,
      message: `Invalid value for field '${err.path}'`,
    });
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const firstError = Object.values(err.errors)[0];
    return res.status(400).json({
      success: false,
      message: firstError.message,
    });
  }

  if ((err as any).code === 11000) {
    const field = Object.keys((err as any).keyPattern)[0];
    return res.status(409).json({
      success: false,
      message: `${field} already exists`,
    });
  }

  console.error("Unexpected error:", err);

  return res.status(500).json({
    success: false,
    message: "Something went wrong",
  });
};