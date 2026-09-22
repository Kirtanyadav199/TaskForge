import express, { Request, Response } from "express";
import { env } from "./config/env";
import { connectDB } from "./config/db";
import { log } from "console";
import { errorHandler } from "./middlewares/errorHandle";
import { AppError } from "./utils/AppError";
import { validate } from "./middlewares/validate";
import { registerSchema } from "./validators/auth.validator";
import router from "./routes/auth.routes";
import cookieParser from "cookie-parser";
import organizationRoutes from "./routes/organization.routes";




const app = express();
app.use(express.json())
app.use(cookieParser());

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Server is running" });
});

app.get("/test-error", (req: Request, res: Response, next) => {
  next(new AppError("This is a test error", 400));
});

app.post("/test-validation", validate(registerSchema), (req: Request, res: Response) => {
  res.json({ success: true, data: req.body });
});

app.use("/api/auth",router);
app.use("/api/organizations", organizationRoutes);



app.use(errorHandler);

const startServer = async()=>{
  await connectDB();
  app.listen(env.port,()=>{
    console.log(`Server running on http://localhost:${env.port} [${env.nodeEnv}]`);
    
  })
}

startServer();
