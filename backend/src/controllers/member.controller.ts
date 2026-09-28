import { Request, Response, NextFunction } from "express";
import { User } from "../models/user.model";
import { OrganizationMember } from "../models/organizationMember.model";
import { AppError } from "../utils/AppError";
import { AddMemberInput } from "../validators/member.validator";

export const addMember = async (
  req: Request<{ organizationId: string }, {}, AddMemberInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { organizationId } = req.params;
    const { email, role } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError("No registered user found with this email", 404);
    }

    const existing = await OrganizationMember.findOne({
      userId: user._id,
      organizationId,
    });
    if (existing) {
      throw new AppError("User is already a member of this organization", 409);
    }

    const member = await OrganizationMember.create({
      userId: user._id,
      organizationId,
      role,
    });

    res.status(201).json({ success: true, data: member });
  } catch (error) {
    next(error);
  }
};

export const getMembers = async (
  req: Request<{ organizationId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { organizationId } = req.params;

    const members = await OrganizationMember.find({ organizationId }).populate(
      "userId",
      "name email"
    );

    res.status(200).json({ success: true, data: members });
  } catch (error) {
    next(error);
  }
};