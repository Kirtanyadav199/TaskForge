import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app";
import { Comment } from "../models/comment.model";
import {
  createAuthenticatedUser,
  createOrg,
  createProject,
  createTask,
  addMember,
  tasksUrl,
  bearer,
  defaultUser,
  secondUser,
  thirdUser,
} from "./helpers";

const setup = async () => {
  const owner = await createAuthenticatedUser();
  const member = await createAuthenticatedUser(secondUser);
  const orgId = await createOrg(owner.accessToken);
  await addMember(owner.accessToken, orgId, secondUser.email, "member");
  const projectId = await createProject(owner.accessToken, orgId);
  const taskId = await createTask(owner.accessToken, orgId, projectId);
  const url = `${tasksUrl(orgId, projectId)}/${taskId}/comments`;
  return { owner, member, orgId, projectId, taskId, url };
};

const postComment = (url: string, token: string, content = "Looks good") =>
  request(app).post(url).set("Authorization", bearer(token)).send({ content });

describe("comments", () => {
  it("creates a comment and lists it with the author's name and email", async () => {
    const { owner, url } = await setup();

    const created = await postComment(url, owner.accessToken, "First comment");
    expect(created.status).toBe(201);

    const res = await request(app)
      .get(url)
      .set("Authorization", bearer(owner.accessToken));

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].content).toBe("First comment");
    expect(res.body.data[0].userId.name).toBe(defaultUser.name);
    expect(res.body.data[0].userId.email).toBe(defaultUser.email);
    expect(res.body.data[0].userId.password).toBeUndefined();
  });

  it("rejects empty content with 400", async () => {
    const { owner, url } = await setup();

    const res = await postComment(url, owner.accessToken, "");

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Comment cannot be empty");
  });

  it("lists comments oldest first", async () => {
    const { owner, url } = await setup();
    await postComment(url, owner.accessToken, "first");
    await postComment(url, owner.accessToken, "second");

    const res = await request(app)
      .get(url)
      .set("Authorization", bearer(owner.accessToken));

    expect(res.body.data.map((c: { content: string }) => c.content)).toEqual([
      "first",
      "second",
    ]);
  });

  it("lets a member comment, but blocks a non-member", async () => {
    const { member, url } = await setup();
    const outsider = await createAuthenticatedUser(thirdUser);

    const asMember = await postComment(url, member.accessToken);
    expect(asMember.status).toBe(201);

    const asOutsider = await postComment(url, outsider.accessToken);
    expect(asOutsider.status).toBe(403);
  });

  it("returns 404 when the task does not exist", async () => {
    const { owner, orgId, projectId } = await setup();
    const fakeTaskId = "507f1f77bcf86cd799439011";

    const res = await postComment(
      `${tasksUrl(orgId, projectId)}/${fakeTaskId}/comments`,
      owner.accessToken
    );

    expect(res.status).toBe(404);
  });
});

describe("editing and deleting comments", () => {
  it("lets the author edit, and blocks everyone else", async () => {
    const { owner, member, url } = await setup();
    const created = await postComment(url, member.accessToken, "Original");
    const commentId = created.body.data._id;

    const byOther = await request(app)
      .patch(`${url}/${commentId}`)
      .set("Authorization", bearer(owner.accessToken))
      .send({ content: "Hijacked" });
    expect(byOther.status).toBe(404);
    expect((await Comment.findById(commentId))!.content).toBe("Original");

    const byAuthor = await request(app)
      .patch(`${url}/${commentId}`)
      .set("Authorization", bearer(member.accessToken))
      .send({ content: "Edited" });
    expect(byAuthor.status).toBe(200);
    expect(byAuthor.body.data.content).toBe("Edited");
  });

  it("rejects an empty edit with 400", async () => {
    const { member, url } = await setup();
    const created = await postComment(url, member.accessToken, "Original");

    const res = await request(app)
      .patch(`${url}/${created.body.data._id}`)
      .set("Authorization", bearer(member.accessToken))
      .send({ content: "" });

    expect(res.status).toBe(400);
  });

  it("lets the author delete, and blocks everyone else", async () => {
    const { owner, member, url } = await setup();
    const created = await postComment(url, member.accessToken);
    const commentId = created.body.data._id;

    const byOther = await request(app)
      .delete(`${url}/${commentId}`)
      .set("Authorization", bearer(owner.accessToken));
    expect(byOther.status).toBe(404);
    expect(await Comment.findById(commentId)).not.toBeNull();

    const byAuthor = await request(app)
      .delete(`${url}/${commentId}`)
      .set("Authorization", bearer(member.accessToken));
    expect(byAuthor.status).toBe(200);
    expect(await Comment.findById(commentId)).toBeNull();
  });
});

describe("comments: cross-organization protection", () => {
  const setupTwoOrgs = async () => {
    const userA = await createAuthenticatedUser();
    const userB = await createAuthenticatedUser(secondUser);
    const orgA = await createOrg(userA.accessToken, "Org A");
    const orgB = await createOrg(userB.accessToken, "Org B");
    const projectA = await createProject(userA.accessToken, orgA, "Project A");
    const projectB = await createProject(userB.accessToken, orgB, "Project B");
    const taskA = await createTask(userA.accessToken, orgA, projectA);
    await postComment(
      `${tasksUrl(orgA, projectA)}/${taskA}/comments`,
      userA.accessToken,
      "Private comment"
    );

    // Task A, reached through Org B's own org and project in the URL.
    const sneakyUrl = `${tasksUrl(orgB, projectB)}/${taskA}/comments`;
    return { userB, taskA, sneakyUrl };
  };

  it("cannot read another org's comments through your own org URL", async () => {
    const { userB, sneakyUrl } = await setupTwoOrgs();

    const res = await request(app)
      .get(sneakyUrl)
      .set("Authorization", bearer(userB.accessToken));

    expect(res.status).toBe(404);
  });

  it("cannot post a comment on another org's task", async () => {
    const { userB, taskA, sneakyUrl } = await setupTwoOrgs();

    const res = await postComment(sneakyUrl, userB.accessToken, "Injected");

    expect(res.status).toBe(404);
    expect(await Comment.countDocuments({ taskId: taskA })).toBe(1);
  });
});