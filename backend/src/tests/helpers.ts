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