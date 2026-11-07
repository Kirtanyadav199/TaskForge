import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app";
import { User } from "../models/user.model";
import { RefreshToken } from "../models/refreshToken.model";
import {
  defaultUser,
  registerUser,
  loginUser,
  getRefreshCookie,
  createAuthenticatedUser,
} from "./helpers";

describe("POST /api/auth/register", () => {
  it("creates a user and stores a hashed password, not plain text", async () => {
    const res = await registerUser();

    expect(res.status).toBe(201);

    const saved = await User.findOne({ email: defaultUser.email }).select("+password");
    expect(saved).not.toBeNull();
    expect(saved!.password).not.toBe(defaultUser.password);
    expect(saved!.password.startsWith("$2")).toBe(true);
  });

  it("rejects a duplicate email with 409", async () => {
    await registerUser();
    const res = await registerUser();

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("Email already registered");
  });

  it("rejects an invalid email with 400", async () => {
    const res = await registerUser({ email: "not-an-email" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid email address");
  });

  it("rejects a short password with 400", async () => {
    const res = await registerUser({ password: "123" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Password must be at least 6 characters");
  });
});

describe("POST /api/auth/login", () => {
  it("returns an access token and sets an HttpOnly refresh cookie", async () => {
    await registerUser();
    const res = await loginUser();

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toEqual(expect.any(String));

    const cookies = res.headers["set-cookie"] as unknown as string[];
    const refresh = cookies.find((c) => c.startsWith("refreshToken="));
    expect(refresh).toBeDefined();
    expect(refresh).toContain("HttpOnly");
  });

  it("rejects a wrong password with 401", async () => {
    await registerUser();
    const res = await loginUser({ password: "wrong-password" });

    expect(res.status).toBe(401);
  });

  it("gives the same error for unknown email and wrong password", async () => {
    await registerUser();

    const wrongPassword = await loginUser({ password: "wrong-password" });
    const unknownEmail = await loginUser({ email: "nobody@example.com" });

    expect(unknownEmail.status).toBe(401);
    expect(unknownEmail.body.message).toBe(wrongPassword.body.message);
  });

  it("rejects a missing password with 400", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: defaultUser.email });

    expect(res.status).toBe(400);
  });
});

describe("GET /api/auth/me", () => {
  it("returns the current user for a valid token", async () => {
    const { accessToken } = await createAuthenticatedUser();

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(defaultUser.email);
    expect(res.body.data.password).toBeUndefined();
  });

  it("rejects a tampered token with 401", async () => {
    const { accessToken } = await createAuthenticatedUser();

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${accessToken}tampered`);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid token");
  });

  it("rejects a header without the Bearer prefix with 401", async () => {
    const { accessToken } = await createAuthenticatedUser();

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", accessToken);

    expect(res.status).toBe(401);
  });
});

describe("POST /api/auth/refresh", () => {
  it("issues a new access token and rotates the refresh cookie", async () => {
    const { refreshCookie } = await createAuthenticatedUser();

    const res = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", refreshCookie);

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toEqual(expect.any(String));
    expect(getRefreshCookie(res)).not.toBe(refreshCookie);
  });

  it("rejects reuse of an already-used refresh token (rotation)", async () => {
    const { refreshCookie } = await createAuthenticatedUser();

    const first = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", refreshCookie);
    expect(first.status).toBe(200);

    const replay = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", refreshCookie);
    expect(replay.status).toBe(401);
  });

  it("rejects a request with no refresh cookie", async () => {
    const res = await request(app).post("/api/auth/refresh");

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Refresh token missing");
  });
});

describe("POST /api/auth/logout", () => {
  it("revokes the refresh token so it can no longer be used", async () => {
    const { refreshCookie } = await createAuthenticatedUser();

    const logout = await request(app)
      .post("/api/auth/logout")
      .set("Cookie", refreshCookie);
    expect(logout.status).toBe(200);

    const stored = await RefreshToken.findOne({
      token: refreshCookie.split("=")[1],
    });
    expect(stored!.isRevoked).toBe(true);

    const refreshAfter = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", refreshCookie);
    expect(refreshAfter.status).toBe(401);
  });

  it("is idempotent: logging out without a cookie still returns 200", async () => {
    const res = await request(app).post("/api/auth/logout");

    expect(res.status).toBe(200);
  });
});