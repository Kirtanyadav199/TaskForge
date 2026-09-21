import jwt from "jsonwebtoken";
import { env } from "../config/env";

export const generateAccessToken = (userId: string): string => {
  return jwt.sign({ userId }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  } as jwt.SignOptions);
};