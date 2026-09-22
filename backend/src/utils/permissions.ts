import { OrgRole } from "../models/organizationMember.model";

const roleHierarchy: Record<OrgRole, number> = {
  member: 1,
  admin: 2,
  owner: 3,
};

export const hasMinimumRole = (
  userRole: OrgRole,
  requiredRole: OrgRole
): boolean => {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};