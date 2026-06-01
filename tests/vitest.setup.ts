// 모든 테스트 파일이 평가되기 전에 1회 실행되는 글로벌 setup.
// 테스트가 lib/auth(getSecretBytes/verifyCredentials)를 호출하기 전에 필수 env를 채워둔다.
//
// 운영 환경에서는 next.js/Node가 .env.* 를 자동 로드하지만,
// vitest 단독 실행 환경은 그렇지 않으므로 여기서 명시적으로 주입한다.

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  process.env.JWT_SECRET = "test-secret-minimum-length-32-chars-for-validation";
}
if (!process.env.ADMIN_ID) {
  process.env.ADMIN_ID = "admin";
}
if (!process.env.ADMIN_PW) {
  process.env.ADMIN_PW = "test-password";
}
