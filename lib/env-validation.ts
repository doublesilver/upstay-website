// 필수 환경변수 검증 — 시작 시점에 누락이 있으면 명시적 console.error 출력.
// 이걸 미리 안 하면 누락 env가 만든 silent 회귀(예: PUBLIC_ORIGIN 누락으로
// admin PUT만 403, 일반 페이지는 정상)가 운영 단계까지 안 잡혀 사용자가
// "저장에 실패했습니다" 한 줄만 보고 원인을 못 찾는다.

type EnvCheck = {
  name: string;
  required: boolean;
  validate?: (v: string) => string | null; // 검증 통과 시 null, 실패 시 사유
  description: string;
};

const SERVER_CHECKS: EnvCheck[] = [
  {
    name: "JWT_SECRET",
    required: true,
    validate: (v) =>
      v.length < 32 ? `32자 이상이어야 함 (현재 ${v.length})` : null,
    description: "관리자 JWT 서명. 누락 시 admin 인증 영구 실패",
  },
  {
    name: "ADMIN_ID",
    required: true,
    description: "관리자 로그인 아이디. 누락 시 로그인 자체 불가",
  },
  {
    name: "ADMIN_PW",
    required: true,
    description: "관리자 비밀번호. 누락 시 로그인 자체 불가",
  },
  {
    name: "PUBLIC_ORIGIN",
    required: true,
    validate: (v) => {
      const parts = v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (parts.length === 0) return "쉼표 구분 origin이 1개 이상 필요";
      for (const p of parts) {
        if (!/^https?:\/\//.test(p)) return `'${p}'는 origin 형식 아님 (예: https://upstay.co.kr)`;
      }
      return null;
    },
    description:
      "CSRF allowlist. 누락 시 admin PUT/POST/DELETE 모두 403 (저장 실패)",
  },
  {
    name: "DATA_DIR",
    required: false,
    description: "DB+uploads 경로. 기본값 ./data",
  },
];

let validated = false;
export function validateServerEnv(): void {
  if (validated) return;
  validated = true;
  if (typeof process === "undefined" || process.env.NODE_ENV !== "production") {
    return; // dev/test에선 강제 X
  }
  const errors: string[] = [];
  for (const check of SERVER_CHECKS) {
    const v = process.env[check.name];
    if (!v || v.trim() === "") {
      if (check.required) {
        errors.push(
          `[ENV] 필수 환경변수 누락: ${check.name} — ${check.description}`,
        );
      }
      continue;
    }
    if (check.validate) {
      const reason = check.validate(v);
      if (reason) {
        errors.push(`[ENV] ${check.name} 검증 실패: ${reason}`);
      }
    }
  }
  if (errors.length > 0) {
    console.error(
      "\n========== UPSTAY 환경변수 검증 실패 ==========\n" +
        errors.join("\n") +
        "\n\nOCI 운영: sudo nano /etc/upstay/env → 추가 → sudo systemctl restart upstay\n" +
        "==================================================\n",
    );
  } else {
    console.log("[ENV] 필수 환경변수 검증 통과");
  }
}
