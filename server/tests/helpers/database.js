import { after } from "node:test";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { connectDatabase, disconnectDatabase } from "../../src/config/db.js";

let server;

export async function startTestDatabase() {
  server ||= await MongoMemoryServer.create({
    binary: { checkMD5: false },
    instance: { launchTimeout: 60000 },
  });
  process.env.MONGODB_URI = server.getUri("taskora_test");
  if (mongoose.connection.readyState !== 0) await disconnectDatabase();
  await connectDatabase();
}

export async function stopTestDatabase() {
  if (mongoose.connection.readyState !== 0) await mongoose.connection.dropDatabase();
  await disconnectDatabase();
}

after(async () => {
  await server?.stop();
  server = undefined;
});