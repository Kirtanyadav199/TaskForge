import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app";

describe("smoke tests", () => {
  it("returns 401 for /api/auth/me without a token", async () => {
    const res = await request(app).get("/api/auth/me");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("registers a new user and never returns the password", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Test User",
      email: "test@example.com",
      password: "secret123",
    });

    expect(res.status).toBe(201);
    expect(res.body.data.email).toBe("test@example.com");
    expect(res.body.data.password).toBeUndefined();
  });
});