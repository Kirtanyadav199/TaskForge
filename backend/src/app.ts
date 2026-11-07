import express, { Request, Response } from "express";
import { env } from "./config/env";
import { log } from "console";
import { errorHandler } from "./middlewares/errorHandler";
import { AppError } from "./utils/AppError";
import { validate } from "./middlewares/validate";
import { registerSchema } from "./validators/auth.validator";
import router from "./routes/auth.routes";
import cookieParser from "cookie-parser";
import organizationRoutes from "./routes/organization.routes";
import notificationRoutes from "./routes/notification.routes";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { logger } from "./config/logger";





const app = express();
app.use(cors({
    origin: env.frontendUrl,
    credentials: true,
  }));
  app.use(helmet());
  app.use(cors({ origin: env.frontendUrl, credentials: true }));
app.use(helmet());
app.use(pinoHttp({ logger }));
app.use(express.json());
app.use(cookieParser());
app.use(express.json())
app.use(cookieParser());


app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Server is running" });
});


app.use("/api/auth",router);
app.use("/api/organizations", organizationRoutes);

app.use("/api/notifications", notificationRoutes);

app.use(errorHandler);

export default app;