// XMLHttpRequest 기반 단일 파일 업로드 — fetch가 제공하지 않는 업로드 진행률을
// 얻기 위해 XHR을 사용한다. 장당 1요청으로 보내 각 파일의 0-100% 진행률을 독립 추적.
// (배치 5장 묶음 대비: 100MB 요청 본문 한도도 자연 회피, 카드별 진행률도 가능.)
//
// 서버(/api/admin/upload)는 {urls:[...], files:[...]} 형태로 응답. 장당 1요청이라
// 첫 원소만 의미가 있다.

import { friendlyError } from "@/lib/error-messages";

export interface XhrUploadResult {
  url: string;
  file: string;
}

export interface XhrUploadHandlers {
  // 0-100. xhr.upload 바이트 진행률.
  onProgress?: (percent: number) => void;
  // 바이트 전송 100% 완료 → 서버 처리(webp/썸네일 변환) 대기 진입.
  onUploadComplete?: () => void;
  // 취소를 위해 호출부에 xhr 인스턴스를 넘긴다(언마운트 시 abort).
  onStart?: (xhr: XMLHttpRequest) => void;
}

export function xhrUploadFile(
  file: File,
  handlers: XhrUploadHandlers = {},
): Promise<XhrUploadResult> {
  return new Promise<XhrUploadResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const form = new FormData();
    form.append("files", file, file.name);

    xhr.open("POST", "/api/admin/upload");
    xhr.withCredentials = true; // 쿠키(JWT) 동봉 — apiFetch credentials:"include"와 정합.

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && handlers.onProgress) {
        handlers.onProgress((e.loaded / e.total) * 100);
      }
    };

    // 업로드 바이트 전송 완료 → 서버가 변환을 시작하는 구간. "처리중" 표시 트리거.
    xhr.upload.onload = () => handlers.onUploadComplete?.();

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          const url = data?.urls?.[0];
          const savedFile = data?.files?.[0];
          if (typeof url === "string" && url) {
            resolve({ url, file: savedFile ?? "" });
          } else {
            reject(new Error(friendlyError(500)));
          }
        } catch {
          reject(new Error(friendlyError(500)));
        }
        return;
      }
      // 서버가 친절 메시지(JSON {error})를 줬으면 그대로, 아니면 status 기반 변환.
      let serverMsg = "";
      try {
        const data = JSON.parse(xhr.responseText);
        if (data && typeof data.error === "string") serverMsg = data.error;
      } catch {
        /* 비-JSON 응답은 무시하고 status 기반 fallback */
      }
      reject(new Error(serverMsg || friendlyError(xhr.status)));
    };

    // 네트워크 단절·CORS 등.
    xhr.onerror = () => reject(new Error(friendlyError(0)));
    xhr.ontimeout = () => reject(new Error(friendlyError(504)));
    xhr.onabort = () => reject(new DOMException("aborted", "AbortError"));

    handlers.onStart?.(xhr);
    xhr.send(form);
  });
}
