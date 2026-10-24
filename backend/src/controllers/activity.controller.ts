import { Request, Response, NextFunction } from "express";
import { Activity } from "../models/activity.model";
import { GetActivityQuery } from "../validators/activity.validator";

export const getActivity = async (
  req: Request<{ organizationId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { organizationId } = req.params;
    const { page, limit } = req.query as unknown as GetActivityQuery;

    const skip = (page - 1) * limit;

    const [activities, totalCount] = await Promise.all([
      Activity.find({ organizationId })
        .populate("actorId", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Activity.countDocuments({ organizationId }),
    ]);

    res.status(200).json({
      success: true,
      data: activities,
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