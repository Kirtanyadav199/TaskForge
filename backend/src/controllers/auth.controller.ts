import { Request, Response, NextFunction } from "express";
import { User } from "../models/user.model";
import { AppError } from "../utils/AppError";
import { RegisterInput } from "../validators/auth.validator";
import { generateAccessToken, generateRefreshToken } from "../utils/generateToken";
import { env } from "../config/env";
import { LoginInput } from "../validators/auth.validator";
import { RefreshToken } from "../models/refreshToken.model";

export const register = async (
  req: Request<{}, {}, RegisterInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError("Email already registered", 409);
    }

    const user = await User.create({ name, email, password });

    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};


export const login = async (
  req: Request<{}, {}, LoginInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      throw new AppError("Invalid email or password", 401);
    }

    const userId = user._id.toString();
    const accessToken = generateAccessToken(userId);
    const refreshToken = await generateRefreshToken(userId);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: env.nodeEnv === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      data: {
        accessToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};


export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const incomingToken = req.cookies.refreshToken;

    if (!incomingToken) {
      throw new AppError("Refresh token missing", 401);
    }

    const storedToken = await RefreshToken.findOne({
      token: incomingToken,
      isRevoked: false,
    });

    if (!storedToken) {
      throw new AppError("Invalid refresh token", 401);
    }

    if (storedToken.expiresAt < new Date()) {
      throw new AppError("Refresh token expired", 401);
    }

    storedToken.isRevoked = true;
    await storedToken.save();

    const userId = storedToken.userId.toString();
    const newAccessToken = generateAccessToken(userId);
    const newRefreshToken = await generateRefreshToken(userId);

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: env.nodeEnv === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      data: { accessToken: newAccessToken },
    });
  } catch (error) {
    next(error);
  }
};

