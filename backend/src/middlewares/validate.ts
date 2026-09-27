import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { AppError } from "../utils/AppError";

export const validate =
  (schema: z.ZodType, source: "body" | "query" = "body") =>
  (req: Request, res: Response, next: NextFunction) => {
    const dataToValidate = source === "query" ? req.query : req.body;
    const result = schema.safeParse(dataToValidate);

    if (!result.success) {
      const firstError = result.error.issues[0];
      return next(new AppError(firstError.message, 400));
    }

  if (source === "query") {
  Object.defineProperty(req, "query", {
    value: result.data,
    writable: true,
    configurable: true,
    enumerable: true,
  });
} else {
  req.body = result.data;
}

    next();
  };