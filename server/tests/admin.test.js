import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import request from "supertest";
import { createApp } from "../src/app.js";
import { Project } from "../src/models/Project.js";
import { Task } from "../src/models/Task.js";
import { startTestDatabase, stopTestDatabase } from "./helpers/database.js";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "taskora-test-secret-value";

const app = createApp();

async function createAccount(name, email) {
  const response = await request(app).post("/api/auth/register").send({
    name,
    email,
    password: "correcthorse",
  });
  return { cookie: response.headers["set-cookie"], user: response.body.data.user };
}

describe("system administration", () => {
  before(async () => {
    await startTestDatabase();
  });

  after(async () => {
    delete process.env.SYSTEM_ADMIN_EMAIL;
    delete process.env.SYSTEM_ADMIN_BOOTSTRAP_TOKEN;
    await stopTestDatabase();
  });

  it("provisions the configured admin and blocks regular users from admin endpoints", async () => {
    process.env.SYSTEM_ADMIN_EMAIL = "root@taskora.test";
    process.env.SYSTEM_ADMIN_BOOTSTRAP_TOKEN = "test-bootstrap-token-value";
    const account = await createAccount("System Admin", "root@taskora.test");
    const user = await createAccount("Regular User", "regular@taskora.test");
    assert.equal(account.user.systemRole, "user");
    assert.equal(user.user.systemRole, "user");

    const invalidBootstrap = await request(app)
      .post("/api/admin/bootstrap")
      .set("Cookie", account.cookie)
      .send({ token: "wrong-token" });
    assert.equal(invalidBootstrap.status, 403);
    const admin = await request(app)
      .post("/api/admin/bootstrap")
      .set("Cookie", account.cookie)
      .send({ token: "test-bootstrap-token-value" });
    assert.equal(admin.status, 200);
    assert.equal(admin.body.data.user.systemRole, "admin");

    const repeatedBootstrap = await request(app)
      .post("/api/admin/bootstrap")
      .set("Cookie", account.cookie)
      .send({ token: "test-bootstrap-token-value" });
    assert.equal(repeatedBootstrap.status, 409);

    const users = await request(app).get("/api/admin/users").set("Cookie", account.cookie);
    assert.equal(users.status, 200);
    assert.equal(users.body.data.items.length, 2);

    const forbidden = await request(app).get("/api/admin/users").set("Cookie", user.cookie);
    assert.equal(forbidden.status, 403);
  });

  it("lets an admin view and delete projects outside their memberships", async () => {
    const admin = await request(app).post("/api/auth/login").send({
      email: "root@taskora.test",
      password: "correcthorse",
    });
    const owner = await createAccount("Project Owner", "owner-admin-test@taskora.test");
    const created = await request(app)
      .post("/api/projects")
      .set("Cookie", owner.cookie)
      .send({ name: "Admin-managed project" });
    const projectId = created.body.data.project.id;
    const task = await Task.create({
      project: projectId,
      title: "Task to clean up",
      createdBy: owner.user.id,
    });

    const listed = await request(app).get("/api/admin/projects").set("Cookie", admin.headers["set-cookie"]);
    assert.equal(listed.status, 200);
    assert.ok(listed.body.data.items.some((project) => project.id === projectId));

    const detail = await request(app).get(`/api/projects/${projectId}`).set("Cookie", admin.headers["set-cookie"]);
    assert.equal(detail.status, 200);

    const deleted = await request(app)
      .delete(`/api/admin/projects/${projectId}`)
      .set("Cookie", admin.headers["set-cookie"]);
    assert.equal(deleted.status, 200);
    assert.equal(await Project.findById(projectId), null);
    assert.equal(await Task.findById(task._id), null);
  });

  it("allows user role and activation management but protects the last active admin", async () => {
    const admin = await request(app).post("/api/auth/login").send({
      email: "root@taskora.test",
      password: "correcthorse",
    });
    const user = await createAccount("Manageable User", "manageable@taskora.test");
    const promoted = await request(app)
      .patch(`/api/admin/users/${user.user.id}`)
      .set("Cookie", admin.headers["set-cookie"])
      .send({ systemRole: "admin" });
    assert.equal(promoted.status, 200);
    assert.equal(promoted.body.data.user.systemRole, "admin");

    const admins = await request(app)
      .get("/api/admin/users")
      .set("Cookie", admin.headers["set-cookie"]);
    const promotedUser = admins.body.data.items.find((item) => item.id === user.user.id);
    const demoted = await request(app)
      .patch(`/api/admin/users/${user.user.id}`)
      .set("Cookie", admin.headers["set-cookie"])
      .send({ systemRole: "user" });
    assert.equal(demoted.status, 200);

    const lastAdminDemotion = await request(app)
      .patch(`/api/admin/users/${admin.body.data.user.id}`)
      .set("Cookie", admin.headers["set-cookie"])
      .send({ systemRole: "user" });
    assert.equal(lastAdminDemotion.status, 400);

    const suspended = await request(app)
      .patch(`/api/admin/users/${user.user.id}`)
      .set("Cookie", admin.headers["set-cookie"])
      .send({ isActive: false });
    assert.equal(suspended.status, 200);
    assert.equal(suspended.body.data.user.isActive, false);

    const login = await request(app).post("/api/auth/login").send({
      email: "manageable@taskora.test",
      password: "correcthorse",
    });
    assert.equal(login.status, 401);
    assert.equal(promotedUser.systemRole, "admin");
  });

  it("does not expose admin endpoints without authentication", async () => {
    const response = await request(app).get("/api/admin/projects");
    assert.equal(response.status, 401);
  });
});