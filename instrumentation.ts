// Next.js 시작 시점 훅. 환경변수 검증을 server boot 직후 실행해
// 누락 env가 silent 회귀로 운영에 새는 것을 방지.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateServerEnv } = await import("./lib/env-validation");
    validateServerEnv();
  }
}
