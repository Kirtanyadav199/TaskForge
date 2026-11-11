import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app";
import { Notification } from "../models/notification.model";
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
  const member = await createAuthenticatedUser(secondUser);
  const orgId = await createOrg(owner.accessToken);
  await addMember(owner.accessToken, orgId, secondUser.email, "member");
  const projectId = await createProject(owner.accessToken, orgId);
  const taskId = await createTask(owner.accessToken, orgId, projectId, {
    title: "Review designs",
  });
  const commentsUrl = `${tasksUrl(orgId, projectId)}/${taskId}/comments`;
  return { owner, member, commentsUrl };
};

const comment = (url: string, token: string) =>
  request(app)
    .post(url)
    .set("Authorization", bearer(token))
    .send({ content: "Nice work" });

const listNotifications = (token: string) =>
  request(app).get("/api/notifications").set("Authorization", bearer(token));

describe("notifications", () => {
  it("requires authentication", async () => {
    const res = await request(app).get("/api/notifications");

    expect(res.status).toBe(401);
  });

  it("notifies the task creator when someone else comments", async () => {
    const { owner, member, commentsUrl } = await setup();

    await comment(commentsUrl, member.accessToken);

    const res = await listNotifications(owner.accessToken);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].type).toBe("NEW_COMMENT");
    expect(res.body.data[0].message).toContain("Review designs");
    expect(res.body.data[0].isRead).toBe(false);
  });

  it("does not notify you about your own comment", async () => {
    const { owner, commentsUrl } = await setup();

    await comment(commentsUrl, owner.accessToken);

    const res = await listNotifications(owner.accessToken);
    expect(res.body.data).toHaveLength(0);
  });

  it("keeps notifications private to their recipient", async () => {
    const { owner, member, commentsUrl } = await setup();
    await comment(commentsUrl, member.accessToken);

    const ownersList = await listNotifications(owner.accessToken);
    const membersList = await listNotifications(member.accessToken);

    expect(ownersList.body.data).toHaveLength(1);
    expect(membersList.body.data).toHaveLength(0);
  });

  it("marks a notification as read", async () => {
    const { owner, member, commentsUrl } = await setup();
    await comment(commentsUrl, member.accessToken);
    const [notification] = (await listNotifications(owner.accessToken)).body.data;

    const res = await request(app)
      .patch(`/api/notifications/${notification._id}/read`)
      .set("Authorization", bearer(owner.accessToken));
    expect(res.status).toBe(200);

    const after = await listNotifications(owner.accessToken);
    expect(after.body.data[0].isRead).toBe(true);
  });

  it("does not let someone else mark your notification as read", async () => {
    const { owner, member, commentsUrl } = await setup();
    await comment(commentsUrl, member.accessToken);
    const [notification] = (await listNotifications(owner.accessToken)).body.data;

    const res = await request(app)
      .patch(`/api/notifications/${notification._id}/read`)
      .set("Authorization", bearer(member.accessToken));

    expect(res.status).toBe(404);
    expect((await Notification.findById(notification._id))!.isRead).toBe(false);
  });
});