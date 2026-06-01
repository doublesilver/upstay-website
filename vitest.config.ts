import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // 모든 테스트 모듈 평가 이전에 env(JWT_SECRET·ADMIN_*)를 주입.
    setupFiles: ["./tests/vitest.setup.ts"],
  },
});
