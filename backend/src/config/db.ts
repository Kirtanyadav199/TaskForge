import mongoose from "mongoose";
import { env } from "./env";
import { logger } from "./logger";

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(env.mongoUri);
    logger.info("MongoDB connected successfully");
    
  } catch (error) {

   logger.error({ err: error }, "MongoDB connection failed");
   process.exit(1);
  }
};