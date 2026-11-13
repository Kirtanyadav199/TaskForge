import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app";
import {
  createAuthenticatedUser,
  createOrg,
  createProject,
  createTask,
  addMember,
  tasksUrl,
  bearer,
  secondUser,
} from "./helpers";

const setup = async () => {
  const owner = await createAuthenticatedUser();
  const orgId = await createOrg(owner.accessToken);
  const projectId = await createProject(owner.accessToken, orgId);
  return { owner, orgId, projectId };
};

describe("projects", () => {
  it("updates only the provided fields", async () => {
    const { owner, orgId, projectId } = await setup();

    const res = await request(app)
      .patch(`/api/organizations/${orgId}/projects/${projectId}`)
      .set("Authorization", bearer(owner.accessToken))
      .send({ description: "New description" });

    expect(res.status).toBe(200);
    expect(res.body.data.description).toBe("New description");
    expect(res.body.data.name).toBe("Website Redesign");
  });

  it("blocks a plain member from deleting a project, allows the owner", async () => {
    const { owner, orgId, projectId } = await setup();
    const member = await createAuthenticatedUser(secondUser);
    await addMember(owner.accessToken, orgId, secondUser.email, "member");
    const url = `/api/organizations/${orgId}/projects/${projectId}`;

    const asMember = await request(app)
      .delete(url)
      .set("Authorization", bearer(member.accessToken));
    expect(asMember.status).toBe(403);

    const asOwner = await request(app)
      .delete(url)
      .set("Authorization", bearer(owner.accessToken));
    expect(asOwner.status).toBe(200);

    const after = await request(app)
      .get(url)
      .set("Authorization", bearer(owner.accessToken));
    expect(after.status).toBe(404);
  });
});

describe("tasks", () => {
  it("creates a task with default status TODO and priority MEDIUM", async () => {
    const { owner, orgId, projectId } = await setup();

    const res = await request(app)
      .post(tasksUrl(orgId, projectId))
      .set("Authorization", bearer(owner.accessToken))
      .send({ title: "Write tests" });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("TODO");
    expect(res.body.data.priority).toBe("MEDIUM");
  });

  it("ignores a client-supplied status on creation", async () => {
    const { owner, orgId, projectId } = await setup();

    const res = await request(app)
      .post(tasksUrl(orgId, projectId))
      .set("Authorization", bearer(owner.accessToken))
      .send({ title: "Sneaky task", status: "DONE" });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("TODO");
  });

  it("rejects a too-short title with 400", async () => {
    const { owner, orgId, projectId } = await setup();

    const res = await request(app)
      .post(tasksUrl(orgId, projectId))
      .set("Authorization", bearer(owner.accessToken))
      .send({ title: "a" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Title must be at least 2 characters");
  });

  it("rejects assigning a task to someone outside the organization", async () => {
    const { owner, orgId, projectId } = await setup();
    const outsider = await createAuthenticatedUser(secondUser);

    const res = await request(app)
      .post(tasksUrl(orgId, projectId))
      .set("Authorization", bearer(owner.accessToken))
      .send({ title: "Assigned task", assigneeId: outsider.userId });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Assignee must be a member of this organization");
  });

  it("returns 400 for a malformed task id", async () => {
    const { owner, orgId, projectId } = await setup();

    const res = await request(app)
      .get(`${tasksUrl(orgId, projectId)}/abc123`)
      .set("Authorization", bearer(owner.accessToken));

    expect(res.status).toBe(400);
  });

  it("updates status, and rejects an invalid status", async () => {
    const { owner, orgId, projectId } = await setup();
    const taskId = await createTask(owner.accessToken, orgId, projectId);
    const url = `${tasksUrl(orgId, projectId)}/${taskId}`;

    const ok = await request(app)
      .patch(url)
      .set("Authorization", bearer(owner.accessToken))
      .send({ status: "DONE" });
    expect(ok.status).toBe(200);
    expect(ok.body.data.status).toBe("DONE");

    const bad = await request(app)
      .patch(url)
      .set("Authorization", bearer(owner.accessToken))
      .send({ status: "RANDOM" });
    expect(bad.status).toBe(400);
  });

  it("notifies the assignee once, and not again for the same assignee", async () => {
    const { owner, orgId, projectId } = await setup();
    const assignee = await createAuthenticatedUser(secondUser);
    await addMember(owner.accessToken, orgId, secondUser.email);
    const taskId = await createTask(owner.accessToken, orgId, projectId);
    const url = `${tasksUrl(orgId, projectId)}/${taskId}`;

    for (let i = 0; i < 2; i++) {
      await request(app)
        .patch(url)
        .set("Authorization", bearer(owner.accessToken))
        .send({ assigneeId: assignee.userId });
    }

    const res = await request(app)
      .get("/api/notifications")
      .set("Authorization", bearer(assignee.accessToken));

    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].type).toBe("TASK_ASSIGNED");
  });

  it("records a status change in the activity log", async () => {
    const { owner, orgId, projectId } = await setup();
    const taskId = await createTask(owner.accessToken, orgId, projectId);

    await request(app)
      .patch(`${tasksUrl(orgId, projectId)}/${taskId}`)
      .set("Authorization", bearer(owner.accessToken))
      .send({ status: "DONE" });

    const res = await request(app)
      .get(`/api/organizations/${orgId}/activity`)
      .set("Authorization", bearer(owner.accessToken));

    const actions = res.body.data.map((a: { action: string }) => a.action);
    expect(actions).toContain("TASK_CREATED");
    expect(actions).toContain("TASK_STATUS_CHANGED");

    const change = res.body.data.find(
      (a: { action: string }) => a.action === "TASK_STATUS_CHANGED"
    );
    expect(change.message).toContain("from TODO to DONE");
  });

  it("blocks a plain member from deleting a task, allows the owner", async () => {
    const { owner, orgId, projectId } = await setup();
    const member = await createAuthenticatedUser(secondUser);
    await addMember(owner.accessToken, orgId, secondUser.email, "member");
    const taskId = await createTask(owner.accessToken, orgId, projectId);
    const url = `${tasksUrl(orgId, projectId)}/${taskId}`;

    const asMember = await request(app)
      .delete(url)
      .set("Authorization", bearer(member.accessToken));
    expect(asMember.status).toBe(403);

    const asOwner = await request(app)
      .delete(url)
      .set("Authorization", bearer(owner.accessToken));
    expect(asOwner.status).toBe(200);

    const after = await request(app)
      .get(url)
      .set("Authorization", bearer(owner.accessToken));
    expect(after.status).toBe(404);
  });
});

describe("task search, filter and pagination", () => {
  const seed = async () => {
    const ctx = await setup();
    for (const title of ["Fix login bug", "Design dashboard", "Fix login timeout"]) {
      await createTask(ctx.owner.accessToken, ctx.orgId, ctx.projectId, { title });
    }
    return ctx;
  };

  it("searches titles case-insensitively", async () => {
    const { owner, orgId, projectId } = await seed();

    const res = await request(app)
      .get(`${tasksUrl(orgId, projectId)}?search=LOGIN`)
      .set("Authorization", bearer(owner.accessToken));

    expect(res.status).toBe(200);
    expect(res.body.pagination.totalCount).toBe(2);
  });

  it("paginates with page and limit", async () => {
    const { owner, orgId, projectId } = await seed();

    const res = await request(app)
      .get(`${tasksUrl(orgId, projectId)}?limit=2&page=2`)
      .set("Authorization", bearer(owner.accessToken));

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.pagination.totalPages).toBe(2);
    expect(res.body.pagination.totalCount).toBe(3);
  });

  it("filters by status", async () => {
    const { owner, orgId, projectId } = await seed();

    const res = await request(app)
      .get(`${tasksUrl(orgId, projectId)}?status=DONE`)
      .set("Authorization", bearer(owner.accessToken));

    expect(res.body.pagination.totalCount).toBe(0);
  });

  it("rejects a limit above 100 and an invalid status filter", async () => {
    const { owner, orgId, projectId } = await seed();

    const tooBig = await request(app)
      .get(`${tasksUrl(orgId, projectId)}?limit=500`)
      .set("Authorization", bearer(owner.accessToken));
    expect(tooBig.status).toBe(400);

    const badStatus = await request(app)
      .get(`${tasksUrl(orgId, projectId)}?status=INVALID`)
      .set("Authorization", bearer(owner.accessToken));
    expect(badStatus.status).toBe(400);
  });

  it("notifies the assignee when a task is created with an assignee", async () => {
  const { owner, orgId, projectId } = await setup();
  const assignee = await createAuthenticatedUser(secondUser);
  await addMember(owner.accessToken, orgId, secondUser.email);

  await createTask(owner.accessToken, orgId, projectId, {
    title: "Assigned at creation",
    assigneeId: assignee.userId,
  });

  const res = await request(app)
    .get("/api/notifications")
    .set("Authorization", bearer(assignee.accessToken));

  expect(res.body.data).toHaveLength(1);
  expect(res.body.data[0].type).toBe("TASK_ASSIGNED");
});

it("does not notify you when you assign a task to yourself", async () => {
  const { owner, orgId, projectId } = await setup();

  await createTask(owner.accessToken, orgId, projectId, {
    title: "My own task",
    assigneeId: owner.userId,
  });

  const res = await request(app)
    .get("/api/notifications")
    .set("Authorization", bearer(owner.accessToken));

  expect(res.body.data).toHaveLength(0);
});
});