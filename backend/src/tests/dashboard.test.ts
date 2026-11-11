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

const dashboardUrl = (orgId: string) => `/api/organizations/${orgId}/dashboard`;

const seed = async () => {
  const owner = await createAuthenticatedUser();
  const member = await createAuthenticatedUser(secondUser);
  const orgId = await createOrg(owner.accessToken);
  await addMember(owner.accessToken, orgId, secondUser.email, "member");
  const projectId = await createProject(owner.accessToken, orgId);

  // overdue and assigned to the owner
  await createTask(owner.accessToken, orgId, projectId, {
    title: "Overdue and mine",
    dueDate: "2020-01-01",
    assigneeId: owner.userId,
  });
  // not overdue
  await createTask(owner.accessToken, orgId, projectId, {
    title: "Future task",
    dueDate: "2099-01-01",
  });
  // past due date, but already DONE
  const doneTaskId = await createTask(owner.accessToken, orgId, projectId, {
    title: "Old but done",
    dueDate: "2020-01-01",
  });
  await request(app)
    .patch(`${tasksUrl(orgId, projectId)}/${doneTaskId}`)
    .set("Authorization", bearer(owner.accessToken))
    .send({ status: "DONE" });

  return { owner, member, orgId, projectId };
};

describe("dashboard", () => {
  it("returns correct counts for an organization", async () => {
    const { owner, orgId } = await seed();

    const res = await request(app)
      .get(dashboardUrl(orgId))
      .set("Authorization", bearer(owner.accessToken));

    expect(res.status).toBe(200);
    const stats = res.body.data;
    expect(stats.totalTasks).toBe(3);
    expect(stats.completedTasks).toBe(1);
    expect(stats.pendingTasks).toBe(2);
    expect(stats.myAssignedTasks).toBe(1);
    expect(stats.overdueTasks).toBe(1);

    const countFor = (status: string) =>
      stats.breakdown.find((b: { _id: string }) => b._id === status)?.count;
    expect(countFor("TODO")).toBe(2);
    expect(countFor("DONE")).toBe(1);
  });

  it("does not count completed tasks as overdue", async () => {
    const { owner, orgId } = await seed();

    const res = await request(app)
      .get(dashboardUrl(orgId))
      .set("Authorization", bearer(owner.accessToken));

    // two tasks have a past due date, but one of them is DONE
    expect(res.body.data.overdueTasks).toBe(1);
  });

  it("shows 'my assigned tasks' per user", async () => {
    const { member, orgId } = await seed();

    const res = await request(app)
      .get(dashboardUrl(orgId))
      .set("Authorization", bearer(member.accessToken));

    expect(res.body.data.totalTasks).toBe(3);
    expect(res.body.data.myAssignedTasks).toBe(0);
  });

  it("only counts tasks from the requested organization", async () => {
    const { owner, member, orgId } = await seed();
    const otherOrg = await createOrg(member.accessToken, "Other Org");
    const otherProject = await createProject(member.accessToken, otherOrg);
    await createTask(member.accessToken, otherOrg, otherProject);

    const first = await request(app)
      .get(dashboardUrl(orgId))
      .set("Authorization", bearer(owner.accessToken));
    const second = await request(app)
      .get(dashboardUrl(otherOrg))
      .set("Authorization", bearer(member.accessToken));

    expect(first.body.data.totalTasks).toBe(3);
    expect(second.body.data.totalTasks).toBe(1);
  });

  it("returns zeros for an organization without tasks", async () => {
    const owner = await createAuthenticatedUser();
    const orgId = await createOrg(owner.accessToken);

    const res = await request(app)
      .get(dashboardUrl(orgId))
      .set("Authorization", bearer(owner.accessToken));

    expect(res.body.data).toEqual({
      totalTasks: 0,
      completedTasks: 0,
      pendingTasks: 0,
      myAssignedTasks: 0,
      overdueTasks: 0,
      breakdown: [],
    });
  });

  it("returns 403 for a non-member", async () => {
    const { orgId } = await seed();
    const outsider = await createAuthenticatedUser({
      name: "Outsider",
      email: "outsider@example.com",
    });

    const res = await request(app)
      .get(dashboardUrl(orgId))
      .set("Authorization", bearer(outsider.accessToken));

    expect(res.status).toBe(403);
  });
});