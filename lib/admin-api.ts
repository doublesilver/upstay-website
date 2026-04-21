export function getToken() {
  return sessionStorage.getItem("admin_token") || "";
}

export function getHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

export async function apiFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, options);
  if (res.status === 401) {
    sessionStorage.removeItem("admin_token");
    window.location.href = "/admin";
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
