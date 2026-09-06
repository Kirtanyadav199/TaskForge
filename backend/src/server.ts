import express, { Request, Response } from "express";
import { env } from "./config/env";
import { connectDB } from "./config/db";
import { log } from "console";


const app = express();

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Server is running" });
});

const startServer = async()=>{
  await connectDB();
  app.listen(env.port,()=>{
    console.log(`Server running on http://localhost:${env.port} [${env.nodeEnv}]`);
    
  })
}

startServer();
