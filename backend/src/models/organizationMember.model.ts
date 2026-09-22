import mongoose, { Document, Schema, Types } from "mongoose";

export type OrgRole = "owner" | "admin" | "member";

export interface IOrganizationMember extends Document {
  userId: Types.ObjectId;
  organizationId: Types.ObjectId;
  role: OrgRole;
  createdAt: Date;
}

const organizationMemberSchema = new Schema<IOrganizationMember>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    role: {
      type: String,
      enum: ["owner", "admin", "member"],
      default: "member",
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

organizationMemberSchema.index(
  { userId: 1, organizationId: 1 },
  { unique: true }
);

export const OrganizationMember = mongoose.model<IOrganizationMember>(
  "OrganizationMember",
  organizationMemberSchema
);