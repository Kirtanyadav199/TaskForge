import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/tests/**/*.test.ts"],
    setupFiles: ["src/tests/setup.ts"],
    hookTimeout: 120000,
    testTimeout: 30000,
    env: {
      NODE_ENV: "test",
      JWT_SECRET: "test-jwt-secret-not-for-production",
      JWT_EXPIRES_IN: "15m",
      FRONTEND_URL: "http://localhost:3000",
      MONGO_URI: "not-used-in-tests",
    },
  },
});