import pino from "pino";
import { env } from "./env";

export const logger = pino({
  level:
    env.nodeEnv === "test" ? "silent" : env.nodeEnv === "production" ? "info" : "debug",
  redact: [
    "req.headers.authorization",
    "req.headers.cookie",
    'res.headers["set-cookie"]',
  ],
  transport:
    env.nodeEnv === "development"
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined,
});