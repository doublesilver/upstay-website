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
    // 모든 테스트 모듈 평가 이전에 env를 주입.
    // lib/auth.ts가 top-level에서 process.env.JWT_SECRET을 읽어 JWT_SECRET를 export하므로
    // import 시점에 이미 값이 들어가 있어야 한다.
    setupFiles: ["./tests/vitest.setup.ts"],
  },
});
