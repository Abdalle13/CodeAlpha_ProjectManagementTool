import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import request from "supertest";
import { createApp } from "../src/app.js";
import { startTestDatabase, stopTestDatabase } from "./helpers/database.js";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "taskbora-test-secret-value";

const app = createApp();

async function createAccount(name, email) {
  const response = await request(app).post("/api/auth/register").send({
    name,
    email,
    password: "correcthorse",
  });
  return {
    cookie: response.headers["set-cookie"],
    user: response.body.data.user,
  };
}

describe("projects", () => {
  before(async () => {
    await startTestDatabase();
  });

  after(async () => {
    await stopTestDatabase();
  });

  it("creates, lists, and retrieves a project for the owner", async () => {
    const owner = await createAccount("Owner One", `owner-${Date.now()}@taskbora.test`);
    const created = await request(app)
      .post("/api/projects")
      .set("Cookie", owner.cookie)
      .send({ name: "Website refresh", description: "Rebuild the marketing site.", status: "active" });

    assert.equal(created.status, 201);
    assert.equal(created.body.data.project.name, "Website refresh");
    assert.equal(created.body.data.project.myRole, "owner");

    const list = await request(app).get("/api/projects").set("Cookie", owner.cookie);
    assert.equal(list.status, 200);
    assert.equal(list.body.data.items.length, 1);

    const invalidPagination = await request(app)
      .get("/api/projects?page=abc")
      .set("Cookie", owner.cookie);
    assert.equal(invalidPagination.status, 400);

    const detail = await request(app)
      .get(`/api/projects/${created.body.data.project.id}`)
      .set("Cookie", owner.cookie);
    assert.equal(detail.status, 200);
    assert.equal(detail.body.data.project.description, "Rebuild the marketing site.");
  });

  it("hides projects from users who are not members", async () => {
    const owner = await createAccount("Owner Two", `owner2-${Date.now()}@taskbora.test`);
    const stranger = await createAccount("Stranger", `stranger-${Date.now()}@taskbora.test`);
    const created = await request(app)
      .post("/api/projects")
      .set("Cookie", owner.cookie)
      .send({ name: "Private project" });

    const hidden = await request(app)
      .get(`/api/projects/${created.body.data.project.id}`)
      .set("Cookie", stranger.cookie);
    assert.equal(hidden.status, 404);

    const list = await request(app).get("/api/projects").set("Cookie", stranger.cookie);
    assert.equal(list.body.data.items.some((item) => item.id === created.body.data.project.id), false);
  });

  it("lets owners add members and blocks members from deleting the project", async () => {
    const owner = await createAccount("Owner Three", `owner3-${Date.now()}@taskbora.test`);
    const teammate = await createAccount("Teammate", `mate-${Date.now()}@taskbora.test`);
    const created = await request(app)
      .post("/api/projects")
      .set("Cookie", owner.cookie)
      .send({ name: "Shared project" });
    const projectId = created.body.data.project.id;

    const added = await request(app)
      .post(`/api/projects/${projectId}/members`)
      .set("Cookie", owner.cookie)
      .send({ email: teammate.user.email, role: "member" });
    assert.equal(added.status, 201);
    assert.equal(added.body.data.project.members.length, 2);

    const forbiddenDelete = await request(app)
      .delete(`/api/projects/${projectId}`)
      .set("Cookie", teammate.cookie);
    assert.equal(forbiddenDelete.status, 403);

    const updated = await request(app)
      .patch(`/api/projects/${projectId}`)
      .set("Cookie", owner.cookie)
      .send({ status: "completed" });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.data.project.status, "completed");

    const deleted = await request(app).delete(`/api/projects/${projectId}`).set("Cookie", owner.cookie);
    assert.equal(deleted.status, 200);
  });

  it("requires authentication for project routes", async () => {
    const response = await request(app).get("/api/projects");
    assert.equal(response.status, 401);
  });
});
