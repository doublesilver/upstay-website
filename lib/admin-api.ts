import { ErrorMessages, friendlyError } from "@/lib/error-messages";

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
    ErrorMessages.sessionExpired +
      "\n작업 중이던 변경사항은 저장되지 않았을 수 있으니, 다시 로그인 후 확인해주세요.",
  );
  window.location.href = "/admin";
}

export async function apiFetch(url: string, options?: RequestInit) {
  let res: Response;
  try {
    res = await fetch(url, { credentials: "include", ...options });
  } catch (e) {
    // 네트워크 단절·DNS 실패·CORS 차단 등 fetch 자체가 throw 되는 케이스.
    // 기술적인 "Failed to fetch" 대신 친절 메시지로 변환.
    console.error("[apiFetch] 네트워크 오류:", url, e);
    throw new Error(ErrorMessages.networkError);
  }
  if (res.status === 401) {
    handleSessionExpired();
    throw new Error(ErrorMessages.sessionExpired);
  }
  if (!res.ok) {
    // 서버가 이미 친절 메시지로 응답(ErrorMessages)했다면 그대로 노출.
    // 없으면 status 기반 fallback으로 일상 표현 변환.
    let serverMsg = "";
    try {
      const data = await res.clone().json();
      if (data && typeof data.error === "string") serverMsg = data.error;
    } catch {}
    throw new Error(serverMsg || friendlyError(res.status));
  }
  return res;
}

export function errMsg(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
