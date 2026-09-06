import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import {z} from "zod";

export const validate =
  (schema: z.ZodType) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const firstError = result.error.issues[0];
      return next(new AppError(firstError.message, 400));
    }

    req.body = result.data;
    next();
  };