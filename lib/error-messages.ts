// 비개발자(클라이언트 민혁)가 이해할 수 있는 친절한 에러 메시지 카탈로그.
// 기술 용어(401, 500, JWT 등)는 일상 표현으로 풀어준다.
// 사용자 행동 가이드(다시 시도·새로고침·관리자 문의)를 항상 포함.

const SUPPORT_CONTACT = "이은석 (korea5410@gmail.com)";

export const ErrorMessages = {
  // 인증·세션
  sessionExpired:
    "로그인이 풀렸습니다. 다시 로그인하시면 작업을 이어서 하실 수 있어요.",
  loginFailed:
    "아이디 또는 비밀번호가 맞지 않습니다. 다시 확인해 주세요.",
  rateLimited: (sec?: number) =>
    sec
      ? `잘못된 로그인 시도가 너무 많습니다. ${sec}초 후 다시 시도해 주세요.`
      : "잘못된 로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.",

  // 업로드
  uploadStart: (n: number) =>
    `사진 ${n}장을 업로드하고 있어요. 잠시만 기다려 주세요.`,
  uploadProgress: (done: number, total: number) =>
    `사진 업로드 중... ${done}/${total}장`,
  uploadSuccess: (n: number) => `사진 ${n}장이 모두 올라갔어요.`,
  uploadPartial: (success: number, failed: number, reason?: string) =>
    `${success}장 올라가고 ${failed}장은 실패했어요${
      reason ? ` (${reason})` : ""
    }. 실패한 사진을 다시 한 번 올려보세요.`,
  uploadAllFailed: (reason?: string) =>
    `사진 업로드가 실패했어요${
      reason ? ` (${reason})` : ""
    }. 잠시 후 다시 시도해 주세요. 계속 안 되면 ${SUPPORT_CONTACT}으로 알려주세요.`,
  uploadFileTooLarge: (filename: string, sizeMb: number) =>
    `'${filename}' 파일이 너무 커요 (${sizeMb}MB). 20MB 이하 사진만 업로드 가능합니다.`,
  uploadFileBadType: (filename: string) =>
    `'${filename}'은 사진 파일이 아닌 것 같아요. JPG·PNG·WebP·GIF만 업로드할 수 있습니다.`,
  uploadFileCorrupted: (filename: string) =>
    `'${filename}' 파일이 손상된 것 같아요. 같은 사진을 다시 저장 후 업로드해 보세요.`,
  uploadTooManyFiles: (max: number) =>
    `한 번에 최대 ${max}장까지 업로드할 수 있어요. 나눠서 올려주세요.`,
  uploadPixelTooLarge: (filename: string) =>
    `'${filename}' 사진의 해상도가 너무 높아요 (1억 픽셀 이상). 사진 크기를 줄여서 다시 업로드해 주세요.`,
  uploadTimeout:
    "사진 업로드 중 시간이 초과됐어요. 인터넷 연결을 확인하고 다시 시도하시거나, 한 번에 더 적은 장수를 올려주세요.",

  // 저장(공통 mutation)
  saveSuccess: "저장되었어요.",
  saveFailed: (detail?: string) =>
    `저장에 실패했어요${
      detail ? `: ${detail}` : ""
    }. 다시 시도해 주세요. 계속 안 되면 ${SUPPORT_CONTACT}으로 알려주세요.`,
  deleteSuccess: "삭제되었어요.",
  deleteFailed: (detail?: string) =>
    `삭제에 실패했어요${detail ? `: ${detail}` : ""}. 다시 시도해 주세요.`,
  loadFailed:
    "정보를 불러오지 못했어요. 페이지를 새로고침(F5) 해 주세요. 계속 안 되면 잠시 후 다시 시도해 주세요.",

  // 네트워크·서버
  networkError:
    "인터넷 연결에 문제가 있는 것 같아요. 와이파이나 데이터를 확인하고 다시 시도해 주세요.",
  serverBusy:
    "지금 서버가 바쁜 것 같아요. 30초 후에 다시 시도해 주세요.",
  serverError:
    "서버에 일시적인 문제가 있어요. 잠시 후 다시 시도해 주세요. 계속 안 되면 알려주세요.",

  // 입력 검증
  validationFailed: (field?: string) =>
    field
      ? `'${field}' 입력값을 확인해 주세요.`
      : "입력값에 문제가 있어요. 다시 확인해 주세요.",

  // 권한
  forbidden:
    "이 작업을 수행할 권한이 없어요. 다시 로그인하거나 관리자에게 문의해 주세요.",
} as const;

// HTTP status code를 친절 메시지로 매핑.
export function friendlyError(status: number, detail?: string): string {
  switch (status) {
    case 401:
      return ErrorMessages.sessionExpired;
    case 403:
      return ErrorMessages.forbidden;
    case 413:
      return "파일이 너무 큽니다. 사진 크기를 줄여서 다시 시도해 주세요.";
    case 429:
      return ErrorMessages.rateLimited();
    case 500:
    case 502:
    case 503:
      return ErrorMessages.serverError;
    case 504:
      return ErrorMessages.uploadTimeout;
    default:
      if (status >= 400 && status < 500) {
        return ErrorMessages.validationFailed(detail);
      }
      return ErrorMessages.saveFailed(detail);
  }
}
