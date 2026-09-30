import { Request, Response, NextFunction } from "express";
import { Organization } from "../models/organization.model";
import { OrganizationMember } from "../models/organizationMember.model";
import { AppError } from "../utils/AppError";


export const createOrganization = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name } = req.body;
    const userId = req.user!.userId;

    const organization = await Organization.create({ name, ownerId: userId });

    await OrganizationMember.create({
      userId,
      organizationId: organization._id,
      role: "owner",
    });

    res.status(201).json({
      success: true,
      data: organization,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrganizations = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;

    const memberships = await OrganizationMember.find({ userId }).populate(
      "organizationId"
    );

    const organizations = memberships.map((m) => m.organizationId);

    res.status(200).json({ success: true, data: organizations });
  } catch (error) {
    next(error);
  }
};

export const updateOrganization = async (
  req: Request<{ organizationId: string }, {}, { name?: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { organizationId } = req.params;

    const organization = await Organization.findByIdAndUpdate(
      organizationId,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!organization) {
      throw new AppError("Organization not found", 404);
    }

    res.status(200).json({ success: true, data: organization });
  } catch (error) {
    next(error);
  }
};

export const deleteOrganization = async (
  req: Request<{ organizationId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { organizationId } = req.params;

    await Organization.findByIdAndDelete(organizationId);
    await OrganizationMember.deleteMany({ organizationId });

    res.status(200).json({ success: true, message: "Organization deleted" });
  } catch (error) {
    next(error);
  }
};