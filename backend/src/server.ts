import app from "./app";
import { env } from "./config/env";
import { connectDB } from "./config/db";
import { logger } from "./config/logger";

const startServer = async () => {
  await connectDB();
  app.listen(env.port, () => {
    logger.info(`Server running on http://localhost:${env.port} [${env.nodeEnv}]`);
  });
};

startServer();