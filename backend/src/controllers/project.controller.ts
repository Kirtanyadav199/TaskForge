import { Request, Response, NextFunction } from "express";
import { Project } from "../models/project.model";
import { CreateProjectInput } from "../validators/project.validator";
import { AppError } from "../utils/AppError";

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

    res.status(201).json({ success: true, data: project });
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

    const projects = await Project.find({ organizationId }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: projects });
  } catch (error) {
    next(error);
  }
};

export const getProjectById = async (
  req: Request<{ organizationId: string; projectId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { organizationId, projectId } = req.params;

    const project = await Project.findOne({ _id: projectId, organizationId });

    if (!project) {
      throw new AppError("Project not found", 404);
    }

    res.status(200).json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (
  req: Request<{ organizationId: string; projectId: string }, {}, Partial<CreateProjectInput>>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { organizationId, projectId } = req.params;

    const project = await Project.findOneAndUpdate(
      { _id: projectId, organizationId },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!project) {
      throw new AppError("Project not found", 404);
    }

    res.status(200).json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (
  req: Request<{ organizationId: string; projectId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { organizationId, projectId } = req.params;

    const project = await Project.findOneAndDelete({ _id: projectId, organizationId });

    if (!project) {
      throw new AppError("Project not found", 404);
    }

    res.status(200).json({ success: true, message: "Project deleted" });
  } catch (error) {
    next(error);
  }
};