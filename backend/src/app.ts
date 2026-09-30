import express from "express";
import type { ErrorRequestHandler } from "express";
import { healthRouter } from "./routes/health.js";
import { menuRouter } from "./routes/menu.js";

export const app = express();

app.use(express.json());
app.use("/api/health", healthRouter);
app.use("/api/menu", menuRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  console.error("Unhandled request error:", error);
  res.status(500).json({ error: "Internal server error" });
};

app.use(errorHandler);
