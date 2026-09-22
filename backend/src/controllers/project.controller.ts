import { Request, Response, NextFunction } from "express";
import { Project } from "../models/project.model";
import { CreateProjectInput } from "../validators/project.validator";

export const createProject = async (
  req: Request<{ organizationId: string }, {}, CreateProjectInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { organizationId } = req.params;
    const { name, description } = req.body;
    const userId = req.user!.userId;

    const project = await Project.create({
      name,
      description,
      organizationId,
      createdBy: userId,
    });

    res.status(201).json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

export const getProjects = async (
  req: Request<{ organizationId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { organizationId } = req.params;

    const projects = await Project.find({ organizationId }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      data: projects,
    });
  } catch (error) {
    next(error);
  }
};