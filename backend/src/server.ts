import express, { Request, Response } from "express";
import { env } from "./config/env";


const app = express();

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Server is running" });
});

app.listen(env.port, () => {
  console.log(`Server running on http://localhost:${env.port} [${env.nodeEnv}]`);
});

