import { createApp } from "./app.js";
import { env, isProduction, validateProductionEnv } from "./config/env.js";
import { connectDatabase } from "./config/db.js";

const app = createApp();

async function start() {
  try {
    if (isProduction()) validateProductionEnv();
    const db = await connectDatabase();
    if (!db.connected) {
      console.warn(`Database not connected: ${db.reason}`);
    }

    app.listen(env.port, () => {
      console.log(`Taskora API listening on port ${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start Taskora API.");
    if (!isProduction()) {
      console.error(error);
    }
    process.exit(1);
  }
}

start();
