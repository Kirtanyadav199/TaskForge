import { Request, Response, NextFunction } from "express";
import { OrganizationMember, OrgRole } from "../models/organizationMember.model";
import { hasMinimumRole } from "../utils/permissions";
import { AppError } from "../utils/AppError";

export const authorize =
  (requiredRole: OrgRole) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      const organizationId = req.params.organizationId;

      if (!userId) {
        throw new AppError("Not authenticated", 401);
      }

      const membership = await OrganizationMember.findOne({
        userId,
        organizationId,
      });

      if (!membership) {
        throw new AppError("You are not a member of this organization", 403);
      }

      if (!hasMinimumRole(membership.role, requiredRole)) {
        throw new AppError("Insufficient permissions", 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };