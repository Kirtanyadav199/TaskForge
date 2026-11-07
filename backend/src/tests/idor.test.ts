import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app";
import { Project } from "../models/project.model";
import { Task } from "../models/task.model";
import {
  createAuthenticatedUser,
  createOrg,
  createProject,
  createTask,
  tasksUrl,
  bearer,
  secondUser,
} from "./helpers";

describe("IDOR protection (cross-organization access)", () => {
  // userA owns Org A (with a project and a task). userB owns a separate Org B.
  // userB is a legitimate OWNER of Org B, so authorize() passes on Org B URLs.
  // The only thing stopping access to A's data is the parent-ID filtering.
  const setup = async () => {
    const userA = await createAuthenticatedUser();
    const userB = await createAuthenticatedUser(secondUser);
    const orgA = await createOrg(userA.accessToken, "Org A");
    const orgB = await createOrg(userB.accessToken, "Org B");
    const projectA = await createProject(userA.accessToken, orgA, "Project A");
    const projectB = await createProject(userB.accessToken, orgB, "Project B");
    const taskA = await createTask(userA.accessToken, orgA, projectA, {
      title: "Secret task A",
    });
    return { userA, userB, orgA, orgB, projectA, projectB, taskA };
  };

  it("cannot read another org's project through your own org URL", async () => {
    const { userB, orgB, projectA } = await setup();

    const res = await request(app)
      .get(`/api/organizations/${orgB}/projects/${projectA}`)
      .set("Authorization", bearer(userB.accessToken));

    expect(res.status).toBe(404);
  });

  it("cannot update another org's project, and it stays unchanged", async () => {
    const { userB, orgB, projectA } = await setup();

    const res = await request(app)
      .patch(`/api/organizations/${orgB}/projects/${projectA}`)
      .set("Authorization", bearer(userB.accessToken))
      .send({ name: "Hacked" });

    expect(res.status).toBe(404);
    expect((await Project.findById(projectA))!.name).toBe("Project A");
  });

  it("cannot delete another org's project, and it still exists", async () => {
    const { userB, orgB, projectA } = await setup();

    const res = await request(app)
      .delete(`/api/organizations/${orgB}/projects/${projectA}`)
      .set("Authorization", bearer(userB.accessToken));

    expect(res.status).toBe(404);
    expect(await Project.findById(projectA)).not.toBeNull();
  });

  it("cannot read another org's task through your own org and project URL", async () => {
    const { userB, orgB, projectB, taskA } = await setup();

    const res = await request(app)
      .get(`${tasksUrl(orgB, projectB)}/${taskA}`)
      .set("Authorization", bearer(userB.accessToken));

    expect(res.status).toBe(404);
  });

  it("cannot update another org's task, and it stays unchanged", async () => {
    const { userB, orgB, projectB, taskA } = await setup();

    const res = await request(app)
      .patch(`${tasksUrl(orgB, projectB)}/${taskA}`)
      .set("Authorization", bearer(userB.accessToken))
      .send({ title: "Hacked title" });

    expect(res.status).toBe(404);
    expect((await Task.findById(taskA))!.title).toBe("Secret task A");
  });

  it("cannot delete another org's task, and it still exists", async () => {
    const { userB, orgB, projectB, taskA } = await setup();

    const res = await request(app)
      .delete(`${tasksUrl(orgB, projectB)}/${taskA}`)
      .set("Authorization", bearer(userB.accessToken));

    expect(res.status).toBe(404);
    expect(await Task.findById(taskA)).not.toBeNull();
  });

  it("cannot reach a task through a different project in the same org", async () => {
    const { userA, orgA, taskA } = await setup();
    const otherProject = await createProject(userA.accessToken, orgA, "Other Project");

    const res = await request(app)
      .get(`${tasksUrl(orgA, otherProject)}/${taskA}`)
      .set("Authorization", bearer(userA.accessToken));

    expect(res.status).toBe(404);
  });

  it("returns 403 when a non-member uses the other org's URL directly", async () => {
    const { userB, orgA, projectA } = await setup();

    const res = await request(app)
      .get(`/api/organizations/${orgA}/projects/${projectA}`)
      .set("Authorization", bearer(userB.accessToken));

    expect(res.status).toBe(403);
  });
});