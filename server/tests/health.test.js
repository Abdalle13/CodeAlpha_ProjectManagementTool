import assert from "node:assert/strict";
import { describe, it } from "node:test";
import request from "supertest";
import { createApp } from "../src/app.js";

const app = createApp();

describe("GET /api/health", () => {
  it("reports API health without exposing secrets", async () => {
    const response = await request(app).get("/api/health");

    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
    assert.equal(response.body.data.service, "taskora-api");
    assert.equal(response.body.data.status, "ok");
    assert.ok(response.body.data.timestamp);
    assert.ok(["disconnected", "connected", "connecting", "disconnecting", "unknown"].includes(response.body.data.database));
    assert.equal(response.body.data.mongodbUri, undefined);
    assert.equal(response.body.data.jwtSecret, undefined);
  });
});

describe("unknown routes", () => {
  it("returns a consistent not-found payload", async () => {
    const response = await request(app).get("/api/missing");

    assert.equal(response.status, 404);
    assert.equal(response.body.success, false);
    assert.equal(response.body.error.code, "NOT_FOUND");
  });
});
