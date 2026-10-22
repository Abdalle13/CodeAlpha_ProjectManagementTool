import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import request from "supertest";
import mongoose from "mongoose";
import { createApp } from "../src/app.js";
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

describe("project tasks", () => {
  before(async () => {
    await startTestDatabase();
  });

  after(async () => {
    await stopTestDatabase();
  });

  it("creates, lists, and updates tasks for project members", async () => {
    const owner = await createAccount("Task Owner", `task-owner-${Date.now()}@taskora.test`);
    const projectResponse = await request(app)
      .post("/api/projects")
      .set("Cookie", owner.cookie)
      .send({ name: "Task project" });
    const projectId = projectResponse.body.data.project.id;

    const created = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set("Cookie", owner.cookie)
      .send({ title: "Plan the release", priority: "high", status: "todo" });
    assert.equal(created.status, 201);
    assert.equal(created.body.data.task.title, "Plan the release");
    assert.equal(created.body.data.task.project.name, "Task project");

    const listed = await request(app).get(`/api/projects/${projectId}/tasks`).set("Cookie", owner.cookie);
    assert.equal(listed.status, 200);
    assert.equal(listed.body.data.items.length, 1);

    const updated = await request(app)
      .patch(`/api/projects/${projectId}/tasks/${created.body.data.task.id}`)
      .set("Cookie", owner.cookie)
      .send({ status: "in_progress", priority: "urgent" });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.data.task.status, "in_progress");
    assert.equal(updated.body.data.task.priority, "urgent");
  });

  it("rejects invalid task fields and users outside the project", async () => {
    const owner = await createAccount("Private Task Owner", `private-${Date.now()}@taskora.test`);
    const stranger = await createAccount("Outside User", `outside-${Date.now()}@taskora.test`);
    const projectResponse = await request(app)
      .post("/api/projects")
      .set("Cookie", owner.cookie)
      .send({ name: "Private task project" });
    const projectId = projectResponse.body.data.project.id;

    const invalid = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set("Cookie", owner.cookie)
      .send({ title: "X", status: "blocked" });
    assert.equal(invalid.status, 400);

    const hidden = await request(app).get(`/api/projects/${projectId}/tasks`).set("Cookie", stranger.cookie);
    assert.equal(hidden.status, 404);
  });

  it("limits task edits and deletion to authorized project members", async () => {
    const owner = await createAccount("Delete Owner", `delete-owner-${Date.now()}@taskora.test`);
    const teammate = await createAccount("Task Teammate", `task-mate-${Date.now()}@taskora.test`);
    const projectResponse = await request(app)
      .post("/api/projects")
      .set("Cookie", owner.cookie)
      .send({ name: "Shared task project" });
    const projectId = projectResponse.body.data.project.id;
    await request(app)
      .post(`/api/projects/${projectId}/members`)
      .set("Cookie", owner.cookie)
      .send({ email: teammate.user.email, role: "member" });
    const taskResponse = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set("Cookie", owner.cookie)
      .send({ title: "Owner-only cleanup" });
    const taskId = taskResponse.body.data.task.id;

    const deniedEdit = await request(app)
      .patch(`/api/projects/${projectId}/tasks/${taskId}`)
      .set("Cookie", teammate.cookie)
      .send({ title: "Changed title" });
    assert.equal(deniedEdit.status, 403);

    const deniedAssignment = await request(app)
      .patch(`/api/projects/${projectId}/tasks/${taskId}`)
      .set("Cookie", teammate.cookie)
      .send({ assigneeId: teammate.user.id });
    assert.equal(deniedAssignment.status, 403);

    const deniedDelete = await request(app)
      .delete(`/api/projects/${projectId}/tasks/${taskId}`)
      .set("Cookie", teammate.cookie);
    assert.equal(deniedDelete.status, 403);

    const deleted = await request(app)
      .delete(`/api/projects/${projectId}/tasks/${taskId}`)
      .set("Cookie", owner.cookie);
    assert.equal(deleted.status, 200);
  });

  it("requires authentication", async () => {
    const response = await request(app).get(`/api/projects/${new mongoose.Types.ObjectId()}/tasks`);
    assert.equal(response.status, 401);
  });

  it("allows project members to comment and exposes actor-attributed activity", async () => {
    const owner = await createAccount("Comment Owner", `comment-owner-${Date.now()}@taskora.test`);
    const outsider = await createAccount("Comment Outsider", `comment-outsider-${Date.now()}@taskora.test`);
    const projectResponse = await request(app)
      .post("/api/projects")
      .set("Cookie", owner.cookie)
      .send({ name: "Collaboration project" });
    const projectId = projectResponse.body.data.project.id;
    const taskResponse = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set("Cookie", owner.cookie)
      .send({ title: "Review proposal" });
    const taskId = taskResponse.body.data.task.id;

    const created = await request(app)
      .post(`/api/projects/${projectId}/tasks/${taskId}/comments`)
      .set("Cookie", owner.cookie)
      .send({ body: "I have reviewed this." });
    assert.equal(created.status, 201);
    assert.equal(created.body.data.comment.author.name, "Comment Owner");

    const comments = await request(app)
      .get(`/api/projects/${projectId}/tasks/${taskId}/comments`)
      .set("Cookie", owner.cookie);
    assert.equal(comments.status, 200);
    assert.equal(comments.body.data.items[0].body, "I have reviewed this.");

    const hidden = await request(app)
      .get(`/api/projects/${projectId}/tasks/${taskId}/comments`)
      .set("Cookie", outsider.cookie);
    assert.equal(hidden.status, 404);

    const activity = await request(app).get(`/api/projects/${projectId}/activity`).set("Cookie", owner.cookie);
    assert.equal(activity.status, 200);
    assert.ok(activity.body.data.items.some((item) => item.action === "comment.created"));
    assert.ok(activity.body.data.items.every((item) => item.actor.name === "Comment Owner"));
  });

  it("returns dashboard metrics calculated from accessible projects and tasks", async () => {
    const owner = await createAccount("Dashboard Owner", `dashboard-owner-${Date.now()}@taskora.test`);
    const outsider = await createAccount("Dashboard Outsider", `dashboard-outsider-${Date.now()}@taskora.test`);
    const projectResponse = await request(app)
      .post("/api/projects")
      .set("Cookie", owner.cookie)
      .send({ name: "Metrics project" });
    const projectId = projectResponse.body.data.project.id;
    await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set("Cookie", owner.cookie)
      .send({ title: "Assigned work", assigneeId: owner.user.id, status: "in_progress" });

    const dashboard = await request(app).get("/api/dashboard").set("Cookie", owner.cookie);
    assert.equal(dashboard.status, 200);
    assert.equal(dashboard.body.data.metrics.totalProjects, 1);
    assert.equal(dashboard.body.data.metrics.totalTasks, 1);
    assert.equal(dashboard.body.data.metrics.assignedToMe, 1);
    assert.equal(dashboard.body.data.metrics.inProgress, 1);

    const isolated = await request(app).get("/api/dashboard").set("Cookie", outsider.cookie);
    assert.equal(isolated.body.data.metrics.totalProjects, 0);
    assert.equal(isolated.body.data.metrics.totalTasks, 0);
  });

  it("lists only accessible tasks with bounded filters and pagination", async () => {
    const owner = await createAccount("Collection Owner", `collection-owner-${Date.now()}@taskora.test`);
    const outsider = await createAccount("Collection Outsider", `collection-outsider-${Date.now()}@taskora.test`);
    const projectResponse = await request(app)
      .post("/api/projects")
      .set("Cookie", owner.cookie)
      .send({ name: "Collection project" });
    const projectId = projectResponse.body.data.project.id;
    await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set("Cookie", owner.cookie)
      .send({ title: "Filtered task", priority: "high", status: "todo" });

    const filtered = await request(app)
      .get("/api/tasks?status=todo&priority=high&page=1&limit=1")
      .set("Cookie", owner.cookie);
    assert.equal(filtered.status, 200);
    assert.equal(filtered.body.data.items.length, 1);
    assert.equal(filtered.body.data.pagination.total, 1);

    const isolated = await request(app).get("/api/tasks").set("Cookie", outsider.cookie);
    assert.equal(isolated.status, 200);
    assert.equal(isolated.body.data.items.length, 0);

    const oversized = await request(app).get("/api/tasks?limit=51").set("Cookie", owner.cookie);
    assert.equal(oversized.status, 400);
    const invalidBoolean = await request(app).get("/api/tasks?assignedToMe=yes").set("Cookie", owner.cookie);
    assert.equal(invalidBoolean.status, 400);
  });
});