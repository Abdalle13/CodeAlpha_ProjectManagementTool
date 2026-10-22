import dns from 'node:dns';
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // fallback to system default
}

import mongoose from "mongoose";
import { env, isTest } from "./env.js";

export async function connectDatabase() {
  if (!env.mongodbUri) {
    return { connected: false, reason: "MONGODB_URI is not set" };
  }

  mongoose.set("strictQuery", true);

  await mongoose.connect(env.mongodbUri, {
    serverSelectionTimeoutMS: isTest() ? 2000 : 8000,
  });

  return { connected: true };
}

export function getDatabaseStatus() {
  const states = ["disconnected", "connected", "connecting", "disconnecting"];
  return states[mongoose.connection.readyState] ?? "unknown";
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
