import jwt from "jsonwebtoken";
import { env } from "../config/env";

import crypto from "crypto";
import { RefreshToken } from "../models/refreshToken.model";

export const generateAccessToken = (userId: string): string => {
  return jwt.sign({ userId }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  } as jwt.SignOptions);
};




export const generateRefreshToken = async (userId: string): Promise<string> => {
  const token = crypto.randomBytes(40).toString("hex");

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await RefreshToken.create({
    token,
    userId,
    expiresAt,
  });

  return token;
};