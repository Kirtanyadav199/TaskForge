import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app";
import { Organization } from "../models/organization.model";
import { OrganizationMember } from "../models/organizationMember.model";
import {
  createAuthenticatedUser,
  createOrg,
  addMember,
  bearer,
  secondUser,
  thirdUser,
} from "./helpers";

describe("organizations", () => {
  it("requires authentication to create an organization", async () => {
    const res = await request(app).post("/api/organizations").send({ name: "Acme" });

    expect(res.status).toBe(401);
  });

  it("makes the creator the owner", async () => {
    const owner = await createAuthenticatedUser();
    const orgId = await createOrg(owner.accessToken);

    const membership = await OrganizationMember.findOne({
      userId: owner.userId,
      organizationId: orgId,
    });
    expect(membership!.role).toBe("owner");
  });

  it("rejects a missing name with 400", async () => {
    const owner = await createAuthenticatedUser();

    const res = await request(app)
      .post("/api/organizations")
      .set("Authorization", bearer(owner.accessToken))
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Organization name is required");
  });

  it("lists only the organizations the user belongs to", async () => {
    const a = await createAuthenticatedUser();
    const b = await createAuthenticatedUser(secondUser);
    await createOrg(a.accessToken, "Org A");
    await createOrg(b.accessToken, "Org B");

    const res = await request(app)
      .get("/api/organizations")
      .set("Authorization", bearer(a.accessToken));

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe("Org A");
  });

  it("returns 403 for a non-member accessing organization resources", async () => {
    const owner = await createAuthenticatedUser();
    const outsider = await createAuthenticatedUser(secondUser);
    const orgId = await createOrg(owner.accessToken);

    const res = await request(app)
      .get(`/api/organizations/${orgId}/members`)
      .set("Authorization", bearer(outsider.accessToken));

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("You are not a member of this organization");
  });

  it("returns 400 for a malformed organization id", async () => {
    const owner = await createAuthenticatedUser();

    const res = await request(app)
      .get("/api/organizations/not-an-id/members")
      .set("Authorization", bearer(owner.accessToken));

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid organization ID");
  });

  it("lets the owner rename but blocks an admin (owner-only action)", async () => {
    const owner = await createAuthenticatedUser();
    const admin = await createAuthenticatedUser(secondUser);
    const orgId = await createOrg(owner.accessToken);
    await addMember(owner.accessToken, orgId, secondUser.email, "admin");

    const asAdmin = await request(app)
      .patch(`/api/organizations/${orgId}`)
      .set("Authorization", bearer(admin.accessToken))
      .send({ name: "Hacked" });
    expect(asAdmin.status).toBe(403);
    expect((await Organization.findById(orgId))!.name).toBe("Acme Inc");

    const asOwner = await request(app)
      .patch(`/api/organizations/${orgId}`)
      .set("Authorization", bearer(owner.accessToken))
      .send({ name: "Renamed Inc" });
    expect(asOwner.status).toBe(200);
    expect(asOwner.body.data.name).toBe("Renamed Inc");
  });

  it("deletes the organization and its memberships", async () => {
    const owner = await createAuthenticatedUser();
    const orgId = await createOrg(owner.accessToken);

    const res = await request(app)
      .delete(`/api/organizations/${orgId}`)
      .set("Authorization", bearer(owner.accessToken));

    expect(res.status).toBe(200);
    expect(await Organization.findById(orgId)).toBeNull();
    expect(await OrganizationMember.countDocuments({ organizationId: orgId })).toBe(0);
  });
});

describe("organization members and roles", () => {
  const setup = async () => {
    const owner = await createAuthenticatedUser();
    const second = await createAuthenticatedUser(secondUser);
    const third = await createAuthenticatedUser(thirdUser);
    const orgId = await createOrg(owner.accessToken);
    return { owner, second, third, orgId };
  };

  const membersUrl = (orgId: string) => `/api/organizations/${orgId}/members`;

  it("lets the owner add a registered user as a member", async () => {
    const { owner, orgId } = await setup();

    const res = await addMember(owner.accessToken, orgId, secondUser.email);
    expect(res.status).toBe(201);

    const list = await request(app)
      .get(membersUrl(orgId))
      .set("Authorization", bearer(owner.accessToken));
    expect(list.body.data).toHaveLength(2);
  });

  it("returns 404 when adding an unregistered email", async () => {
    const { owner, orgId } = await setup();

    const res = await addMember(owner.accessToken, orgId, "ghost@example.com");

    expect(res.status).toBe(404);
  });

  it("returns 409 when adding someone who is already a member", async () => {
    const { owner, orgId } = await setup();
    await addMember(owner.accessToken, orgId, secondUser.email);

    const res = await addMember(owner.accessToken, orgId, secondUser.email);

    expect(res.status).toBe(409);
  });

  it("blocks a plain member from adding members, allows an admin", async () => {
    const { owner, second, orgId } = await setup();
    await addMember(owner.accessToken, orgId, secondUser.email, "member");

    const asMember = await addMember(second.accessToken, orgId, thirdUser.email);
    expect(asMember.status).toBe(403);

    await request(app)
      .patch(`${membersUrl(orgId)}/${second.userId}/role`)
      .set("Authorization", bearer(owner.accessToken))
      .send({ role: "admin" });

    const asAdmin = await addMember(second.accessToken, orgId, thirdUser.email);
    expect(asAdmin.status).toBe(201);
  });

  it("only the owner can change roles", async () => {
    const { owner, second, third, orgId } = await setup();
    await addMember(owner.accessToken, orgId, secondUser.email, "admin");
    await addMember(owner.accessToken, orgId, thirdUser.email, "member");

    const asAdmin = await request(app)
      .patch(`${membersUrl(orgId)}/${third.userId}/role`)
      .set("Authorization", bearer(second.accessToken))
      .send({ role: "admin" });
    expect(asAdmin.status).toBe(403);

    const asOwner = await request(app)
      .patch(`${membersUrl(orgId)}/${third.userId}/role`)
      .set("Authorization", bearer(owner.accessToken))
      .send({ role: "admin" });
    expect(asOwner.status).toBe(200);
    expect(asOwner.body.data.role).toBe("admin");
  });

  it("does not allow changing the owner's role", async () => {
    const { owner, orgId } = await setup();

    const res = await request(app)
      .patch(`${membersUrl(orgId)}/${owner.userId}/role`)
      .set("Authorization", bearer(owner.accessToken))
      .send({ role: "member" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Owner's role cannot be changed");
  });

  it("does not allow promoting someone to owner through the API", async () => {
    const { owner, second, orgId } = await setup();
    await addMember(owner.accessToken, orgId, secondUser.email);

    const res = await request(app)
      .patch(`${membersUrl(orgId)}/${second.userId}/role`)
      .set("Authorization", bearer(owner.accessToken))
      .send({ role: "owner" });

    expect(res.status).toBe(400);
  });

  it("does not allow removing the owner", async () => {
    const { owner, orgId } = await setup();

    const res = await request(app)
      .delete(`${membersUrl(orgId)}/${owner.userId}`)
      .set("Authorization", bearer(owner.accessToken));

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Owner cannot be removed");
  });

  it("blocks a member from removing another member", async () => {
    const { owner, second, third, orgId } = await setup();
    await addMember(owner.accessToken, orgId, secondUser.email, "member");
    await addMember(owner.accessToken, orgId, thirdUser.email, "member");

    const res = await request(app)
      .delete(`${membersUrl(orgId)}/${third.userId}`)
      .set("Authorization", bearer(second.accessToken));

    expect(res.status).toBe(403);
  });

  it("blocks an admin from removing another admin, but the owner can", async () => {
    const { owner, second, third, orgId } = await setup();
    await addMember(owner.accessToken, orgId, secondUser.email, "admin");
    await addMember(owner.accessToken, orgId, thirdUser.email, "admin");

    const asAdmin = await request(app)
      .delete(`${membersUrl(orgId)}/${third.userId}`)
      .set("Authorization", bearer(second.accessToken));
    expect(asAdmin.status).toBe(403);

    const asOwner = await request(app)
      .delete(`${membersUrl(orgId)}/${third.userId}`)
      .set("Authorization", bearer(owner.accessToken));
    expect(asOwner.status).toBe(200);
  });

  it("lets a member leave, and they lose access afterwards", async () => {
    const { owner, second, orgId } = await setup();
    await addMember(owner.accessToken, orgId, secondUser.email);

    const leave = await request(app)
      .delete(`${membersUrl(orgId)}/${second.userId}`)
      .set("Authorization", bearer(second.accessToken));
    expect(leave.status).toBe(200);

    const after = await request(app)
      .get(membersUrl(orgId))
      .set("Authorization", bearer(second.accessToken));
    expect(after.status).toBe(403);
  });
});