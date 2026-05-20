export function getHeaders() {
  return {
    "Content-Type": "application/json",
  };
}

// JWT 만료(401) 시 페이지를 redirect 하기 전 사용자에게 명확한 안내를 띄운다.
// 기존엔 window.location.href = "/admin" 만 호출해 flash 메시지를 띄울 새도 없이
// 페이지가 이동했고, 그 결과 클라이언트 입장에서는 "업로드가 안 되는데 아무 메시지도 안 뜸"
// 으로 보이는 silent fail 이 발생. alert 동기 차단으로 반드시 인지시킨 뒤 이동.
let redirectingForAuth = false;
function handleSessionExpired() {
  if (typeof window === "undefined") return;
  if (redirectingForAuth) return;
  redirectingForAuth = true;
  alert(
    "로그인 세션이 만료되어 다시 로그인해야 합니다.\n작업 중이던 변경사항은 저장되지 않았을 수 있으니, 다시 로그인 후 확인해주세요.",
  );
  window.location.href = "/admin";
}

export async function apiFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, { credentials: "include", ...options });
  if (res.status === 401) {
    handleSessionExpired();
    throw new Error("인증이 만료되었습니다");
  }
  if (!res.ok) {
    let detail = "";
    try {
      const data = await res.clone().json();
      detail = data?.error ? `: ${data.error}` : "";
    } catch {}
    throw new Error(`${res.status} ${res.statusText}${detail}`);
  }
  return res;
}

export function errMsg(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
