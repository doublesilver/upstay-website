// R2 (Cloudflare) sync — 업로드된 파일을 R2 bucket에 미러링.
// img.upstay.co.kr Custom Domain이 이 bucket을 가리키므로, 사용자 페이지의
// 이미지(NEXT_PUBLIC_IMAGE_HOST=https://img.upstay.co.kr/...)가 R2 CDN에서 서빙됨.
//
// 실패 정책: 자격증명 누락 시 모듈 import 자체는 성공하되 sync()는 logWarn 후 무동작.
// 운영자가 R2 셋업을 마치기 전에도 코드는 정상 빌드·서비스 동작 (OCI 디스크 fallback).
//
// 자격증명: process.env에 다음 5개 필요
//   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_ENDPOINT (선택)

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { readFile } from "fs/promises";
import path from "path";
import { logInfo, logWarn, logError } from "./log";

let client: S3Client | null = null;
let bucket = "";
let warnedMissing = false;

function getClient(): S3Client | null {
  if (client) return client;
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  bucket = process.env.R2_BUCKET || "";
  const endpoint =
    process.env.R2_ENDPOINT ||
    (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : "");

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !endpoint) {
    if (!warnedMissing) {
      logWarn(
        "image",
        "R2 자격증명 미설정 — 업로드 동기화 비활성 (OCI 디스크에서 fallback 서빙)",
        {
          hasAccountId: !!accountId,
          hasAccessKey: !!accessKeyId,
          hasSecret: !!secretAccessKey,
          hasBucket: !!bucket,
          hasEndpoint: !!endpoint,
        },
      );
      warnedMissing = true;
    }
    return null;
  }

  client = new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });
  return client;
}

// 확장자 → MIME 매핑. variants 키마다 정확히 지정해야 Cloudflare가 Content-Type 헤더로 응답.
const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
};

function mimeFromKey(key: string): string {
  // .thumb.webp / .medium.webp / .webp / .avif 처리
  if (key.endsWith(".thumb.webp") || key.endsWith(".medium.webp"))
    return "image/webp";
  const ext = path.extname(key).toLowerCase();
  return MIME_BY_EXT[ext] || "application/octet-stream";
}

// 단일 파일을 R2에 업로드. 키는 파일명 (img.upstay.co.kr/<key>로 서빙됨).
export async function syncToR2(localPath: string, key: string): Promise<void> {
  const c = getClient();
  if (!c) return;
  try {
    const body = await readFile(localPath);
    await c.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: mimeFromKey(key),
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    logInfo("image", "R2 sync 완료", { key, bytes: body.length });
  } catch (e) {
    logError("image", "R2 sync 실패", e, { key });
  }
}

// 원본 + 모든 variants(.thumb.webp/.medium.webp/.webp/.avif)를 R2로 동기화.
// 각 파일은 독립 — 하나가 실패해도 다른 것 계속 시도.
// avif는 변경 호출자가 생성 완료를 기다린 뒤 또 한번 syncToR2 호출하는 패턴.
export async function syncVariantsToR2(originalPath: string): Promise<void> {
  const c = getClient();
  if (!c) return;
  const filename = path.basename(originalPath);
  const variants = [
    { localPath: originalPath, key: filename },
    { localPath: `${originalPath}.thumb.webp`, key: `${filename}.thumb.webp` },
    { localPath: `${originalPath}.medium.webp`, key: `${filename}.medium.webp` },
    { localPath: `${originalPath}.webp`, key: `${filename}.webp` },
  ];
  // 직렬화 — 1/8 OCPU에서 R2 SDK + 디스크 read 병렬은 메모리 압박.
  for (const v of variants) {
    try {
      await syncToR2(v.localPath, v.key);
    } catch (e) {
      // syncToR2 자체에서 catch하지만 readFile ENOENT 같은 경우엔 다음 파일로.
      logWarn("image", "R2 variant 스킵", {
        key: v.key,
        err: (e as Error).message,
      });
    }
  }
}
