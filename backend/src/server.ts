import express, { Request, Response } from "express";
import { env } from "./config/env";
import { connectDB } from "./config/db";
import { log } from "console";
import { errorHandler } from "./middlewares/errorHandle";
import { AppError } from "./utils/AppError";


const app = express();

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Server is running" });
});

app.get("/test-error", (req: Request, res: Response, next) => {
  next(new AppError("This is a test error", 400));
});



app.use(errorHandler);

const startServer = async()=>{
  await connectDB();
  app.listen(env.port,()=>{
    console.log(`Server running on http://localhost:${env.port} [${env.nodeEnv}]`);
    
  })
}

startServer();
