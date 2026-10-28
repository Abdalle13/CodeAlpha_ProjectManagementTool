import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import request from "supertest";
import { createApp } from "../src/app.js";
import { startTestDatabase, stopTestDatabase } from "./helpers/database.js";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "taskbora-test-secret-value";

const app = createApp();

describe("authentication", () => {
  before(async () => {
    await startTestDatabase();
  });

  after(async () => {
    await stopTestDatabase();
  });

  const uniqueEmail = () => `ada-${Date.now()}-${Math.random().toString(16).slice(2)}@taskbora.test`;

  it("registers a user and returns a public profile with an auth cookie", async () => {
    const email = uniqueEmail();
    const response = await request(app).post("/api/auth/register").send({
      name: "Ada Lovelace",
      email,
      password: "correcthorse",
    });

    assert.equal(response.status, 201);
    assert.equal(response.body.success, true);
    assert.equal(response.body.data.user.email, email);
    assert.equal(response.body.data.user.name, "Ada Lovelace");
    assert.equal(response.body.data.user.passwordHash, undefined);
    assert.equal(response.body.data.user.password, undefined);
    assert.match(response.headers["set-cookie"]?.join(";") || "", /taskbora_token=/);
  });

  it("rejects duplicate emails", async () => {
    const email = uniqueEmail();
    await request(app).post("/api/auth/register").send({
      name: "Ada Lovelace",
      email,
      password: "correcthorse",
    });

    const response = await request(app).post("/api/auth/register").send({
      name: "Ada Byron",
      email,
      password: "correcthorse",
    });

    assert.equal(response.status, 409);
    assert.equal(response.body.error.code, "CONFLICT");
  });

  it("rejects short passwords and invalid emails", async () => {
    const short = await request(app).post("/api/auth/register").send({
      name: "Ada",
      email: uniqueEmail(),
      password: "short",
    });
    assert.equal(short.status, 400);

    const invalidEmail = await request(app).post("/api/auth/register").send({
      name: "Ada",
      email: "not-an-email",
      password: "correcthorse",
    });
    assert.equal(invalidEmail.status, 400);
  });

  it("rejects state-changing requests from an unconfigured origin", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .set("Origin", "https://untrusted.example")
      .send({ email: "person@taskbora.test", password: "correcthorse" });
    assert.equal(response.status, 403);
    assert.equal(response.body.error.code, "FORBIDDEN");
  });

  it("logs in with valid credentials and rejects invalid ones", async () => {
    const email = uniqueEmail();
    await request(app).post("/api/auth/register").send({
      name: "Ada Lovelace",
      email,
      password: "correcthorse",
    });

    const invalid = await request(app).post("/api/auth/login").send({
      email,
      password: "wrong-password",
    });
    assert.equal(invalid.status, 401);

    const valid = await request(app).post("/api/auth/login").send({
      email,
      password: "correcthorse",
    });
    assert.equal(valid.status, 200);
    assert.equal(valid.body.data.user.email, email);
    assert.equal(valid.body.data.user.passwordHash, undefined);
  });

  it("returns the current user and handles logout", async () => {
    const email = uniqueEmail();
    const created = await request(app).post("/api/auth/register").send({
      name: "Ada Lovelace",
      email,
      password: "correcthorse",
    });
    const cookie = created.headers["set-cookie"];

    const unauthenticated = await request(app).get("/api/auth/me");
    assert.equal(unauthenticated.status, 401);

    const me = await request(app).get("/api/auth/me").set("Cookie", cookie);
    assert.equal(me.status, 200);
    assert.equal(me.body.data.user.email, email);

    const logout = await request(app).post("/api/auth/logout").set("Cookie", cookie);
    assert.equal(logout.status, 200);
  });
});
