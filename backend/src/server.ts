import { app } from "./app.js";
import { config } from "./config/env.js";
import { pool } from "./config/database.js";

const server = app.listen(config.port, () => {
  console.log(`Restaurant OMS API listening on port ${config.port}`);
});

function shutdown(signal: string): void {
  console.log(`${signal} received; shutting down`);
  server.close((serverError) => {
    void pool
      .end()
      .then(() => {
        if (serverError) {
          console.error("HTTP server shutdown failed:", serverError);
          process.exitCode = 1;
        }
      })
      .catch((databaseError: unknown) => {
        console.error("Database pool shutdown failed:", databaseError);
        process.exitCode = 1;
      });
  });
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
