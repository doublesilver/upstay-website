// 서버 로그 헬퍼 — 일관된 prefix·시각·구조화로 OCI journalctl에서 grep 가능.
// 운영 트리아지 시 [upload]/[admin]/[uploads]/[auth] tag로 영역 빠르게 좁힘.

type LogTag =
  | "upload"
  | "admin"
  | "uploads"
  | "auth"
  | "env"
  | "build"
  | "image"
  | "cache";

function fmt(tag: LogTag, level: string, msg: string, extra?: object): string {
  const parts = [`[${tag}]`, `[${level}]`, msg];
  if (extra && Object.keys(extra).length > 0) {
    parts.push(JSON.stringify(extra));
  }
  return parts.join(" ");
}

export function logInfo(tag: LogTag, msg: string, extra?: object): void {
  console.log(fmt(tag, "INFO", msg, extra));
}

export function logWarn(tag: LogTag, msg: string, extra?: object): void {
  console.warn(fmt(tag, "WARN", msg, extra));
}

export function logError(
  tag: LogTag,
  msg: string,
  err?: unknown,
  extra?: object,
): void {
  const errInfo =
    err instanceof Error
      ? { errMessage: err.message, errStack: err.stack?.split("\n")[1]?.trim() }
      : err
        ? { err: String(err) }
        : {};
  console.error(fmt(tag, "ERROR", msg, { ...extra, ...errInfo }));
}

// 작업 시작·종료 시간 측정 + 로그.
export function timed<T>(
  tag: LogTag,
  label: string,
  fn: () => Promise<T>,
  extra?: object,
): Promise<T> {
  const start = Date.now();
  logInfo(tag, `${label} start`, extra);
  return fn().then(
    (result) => {
      logInfo(tag, `${label} done`, { ...extra, durationMs: Date.now() - start });
      return result;
    },
    (err) => {
      logError(tag, `${label} fail`, err, {
        ...extra,
        durationMs: Date.now() - start,
      });
      throw err;
    },
  );
}
