import request from "supertest";
import app from "../app";

export const defaultUser = {
  name: "Test User",
  email: "test@example.com",
  password: "secret123",
};

export const getRefreshCookie = (res: request.Response): string => {
  const cookies = res.headers["set-cookie"] as unknown as string[] | undefined;
  const raw = cookies?.find((c) => c.startsWith("refreshToken="));
  if (!raw) throw new Error("refreshToken cookie was not set");
  return raw.split(";")[0];
};

export const registerUser = (overrides: Record<string, unknown> = {}) =>
  request(app)
    .post("/api/auth/register")
    .send({ ...defaultUser, ...overrides });

export const loginUser = (overrides: Record<string, unknown> = {}) =>
  request(app)
    .post("/api/auth/login")
    .send({
      email: defaultUser.email,
      password: defaultUser.password,
      ...overrides,
    });

export const createAuthenticatedUser = async (
  overrides: Record<string, unknown> = {}
) => {
  const creds = { ...defaultUser, ...overrides };
  await request(app).post("/api/auth/register").send(creds);

  const res = await request(app)
    .post("/api/auth/login")
    .send({ email: creds.email, password: creds.password });

  return {
    accessToken: res.body.data.accessToken as string,
    refreshCookie: getRefreshCookie(res),
    userId: res.body.data.user.id as string,
    creds,
  };
};


export const secondUser = { name: "Second User", email: "second@example.com" };
export const thirdUser = { name: "Third User", email: "third@example.com" };

export const bearer = (token: string) => `Bearer ${token}`;

const mustBe = (res: request.Response, status: number, what: string) => {
  if (res.status !== status) {
    throw new Error(
      `Test setup failed (${what}): got ${res.status} ${JSON.stringify(res.body)}`
    );
  }
};

export const createOrg = async (token: string, name = "Acme Inc") => {
  const res = await request(app)
    .post("/api/organizations")
    .set("Authorization", bearer(token))
    .send({ name });
  mustBe(res, 201, "create org");
  return res.body.data._id as string;
};

export const addMember = (
  token: string,
  orgId: string,
  email: string,
  role: "admin" | "member" = "member"
) =>
  request(app)
    .post(`/api/organizations/${orgId}/members`)
    .set("Authorization", bearer(token))
    .send({ email, role });

export const createProject = async (
  token: string,
  orgId: string,
  name = "Website Redesign"
) => {
  const res = await request(app)
    .post(`/api/organizations/${orgId}/projects`)
    .set("Authorization", bearer(token))
    .send({ name });
  mustBe(res, 201, "create project");
  return res.body.data._id as string;
};

export const tasksUrl = (orgId: string, projectId: string) =>
  `/api/organizations/${orgId}/projects/${projectId}/tasks`;

export const createTask = async (
  token: string,
  orgId: string,
  projectId: string,
  body: Record<string, unknown> = { title: "Write tests" }
) => {
  const res = await request(app)
    .post(tasksUrl(orgId, projectId))
    .set("Authorization", bearer(token))
    .send(body);
  mustBe(res, 201, "create task");
  return res.body.data._id as string;
};