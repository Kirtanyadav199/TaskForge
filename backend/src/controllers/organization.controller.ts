import { Request, Response, NextFunction } from "express";
import { Organization } from "../models/organization.model";
import { OrganizationMember } from "../models/organizationMember.model";

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