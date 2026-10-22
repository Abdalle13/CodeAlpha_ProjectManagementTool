import { createApp } from "../src/app.js";
import { connectDatabase } from "../src/config/db.js";
import { isProduction, validateProductionEnv } from "../src/config/env.js";

const app = createApp();
let connectionPromise;

export default async function handler(request, response) {
  try {
    if (isProduction()) validateProductionEnv();
    connectionPromise ||= connectDatabase();
    await connectionPromise;
    return app(request, response);
  } catch (error) {
    connectionPromise = undefined;
    console.error("Taskora API initialization failed.", error.message);
    return response.status(503).json({
      success: false,
      error: { message: "API is temporarily unavailable.", code: "SERVICE_UNAVAILABLE" },
    });
  }
}