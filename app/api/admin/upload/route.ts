import { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { randomBytes } from "crypto";
import path from "path";
import sharp from "sharp";
import { verifyToken, unauthorized } from "@/lib/auth";
import { UPLOAD_DIR } from "@/lib/paths";
import { logInfo, logWarn, logError } from "@/lib/log";
import { ErrorMessages } from "@/lib/error-messages";
import { syncToR2, syncVariantsToR2 } from "@/lib/r2-sync";

export const dynamic = "force-dynamic";

const MAGIC_NUMBERS: Record<string, number[][]> = {
  jpg: [[0xff, 0xd8, 0xff]],
  png: [[0x89, 0x50, 0x4e, 0x47]],
  gif: [[0x47, 0x49, 0x46, 0x38]],
  webp: [[0x52, 0x49, 0x46, 0x46]],
};

const MAX_DIMENSION = 2048;
const QUALITY = 85;

function checkMagic(buffer: Buffer, ext: string): boolean {
  const normalized = ext.replace(".", "").replace("jpeg", "jpg");
  const magics = MAGIC_NUMBERS[normalized];
  if (!magics) return false;
  return magics.some((magic) => magic.every((b, i) => buffer[i] === b));
}

async function optimize(buffer: Buffer, ext: string): Promise<Buffer> {
  const normalizedExt = ext
    .replace(".", "")
    .toLowerCase()
    .replace("jpeg", "jpg");
  if (normalizedExt === "gif") {
    return buffer;
  }
  // 최신 폰 카메라(예: 갤럭시 S24 Ultra 200MP, iPhone Pro 48MP)가 24M 픽셀을
  // 초과하는 일이 잦음. 24M로 두면 sharp가 throw → catch에서 원본 저장(silent
  // fallback) → 25MB JPEG가 디스크에 그대로 저장되어 DoS 위험.
  // 200M까지 허용해 다운스케일이 정상 수행되도록 함. 메모리 부담은 일시적이며
  // resize fit:inside로 출력은 항상 MAX_DIMENSION(2048) 이내로 줄어듦.
  let pipeline = sharp(buffer, {
    animated: false,
    limitInputPixels: 200_000_000,
    failOn: "truncated",
  })
    .rotate()
    .resize({
      width: MAX_DIMENSION,
      height: MAX_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    });
  if (normalizedExt === "png") {
    pipeline = pipeline.png({ compressionLevel: 9, adaptiveFiltering: true });
  } else if (normalizedExt === "webp") {
    pipeline = pipeline.webp({ quality: QUALITY });
  } else {
    pipeline = pipeline.jpeg({
      quality: QUALITY,
      progressive: true,
      mozjpeg: true,
    });
  }
  return await pipeline.toBuffer();
}

// 업로드 직후 동일 디렉토리에 .webp / .avif 사본 생성.
// 서빙 라우트가 Accept 헤더 보고 미리 만들어둔 파일을 바로 streaming하므로
// 첫 요청부터 sharp 변환 없이 빠름. OCI 1/8 OCPU + 1GB RAM 환경 보호.
// admin은 .thumb.webp(480px), 사례 상세는 .medium.webp(1280px) 요청 — 둘 다 필수.
// 누락 시 admin·R2에서 404 엑박.
//
// 직렬 처리로 변경한 이유: 4종 병렬 sharp는 한 요청당 200-400MB 메모리 일시 점유.
// admin이 동시 5장 업로드하면 1-2GB 압박 → swap 진입 → 응답 지연 → Cloudflare 100s
// timeout 도달 가능. 직렬화하면 한 시점에 하나의 sharp만 동작.
// AVIF는 가장 무거우니(effort 4, 1-3s) 마지막에 백그라운드로 분리 — 다른 3종이
// 디스크에 있어야 admin·R2 즉시 동작 가능.
async function precomputeVariants(originalPath: string): Promise<void> {
  const start = Date.now();
  const filename = path.basename(originalPath);
  const sharpOpts = {
    limitInputPixels: 100_000_000,
    failOn: "truncated" as const,
  };
  try {
    const tThumb = Date.now();
    await sharp(originalPath, sharpOpts)
      .resize(480, null, { withoutEnlargement: true })
      .webp({ quality: 75 })
      .toFile(`${originalPath}.thumb.webp`);
    logInfo("upload", "thumb 완료", {
      filename,
      ms: Date.now() - tThumb,
    });

    const tMedium = Date.now();
    await sharp(originalPath, sharpOpts)
      .resize(1280, null, { withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(`${originalPath}.medium.webp`);
    logInfo("upload", "medium 완료", {
      filename,
      ms: Date.now() - tMedium,
    });

    const tWebp = Date.now();
    await sharp(originalPath, sharpOpts)
      .webp({ quality: 80 })
      .toFile(`${originalPath}.webp`);
    logInfo("upload", "webp 완료", { filename, ms: Date.now() - tWebp });

    logInfo("upload", "variants 3종 완료 (avif는 백그라운드)", {
      filename,
      totalMs: Date.now() - start,
    });
  } catch (e) {
    logError("upload", "variants 처리 중단", e, {
      filename,
      totalMs: Date.now() - start,
    });
    throw e;
  }
  // 원본 + thumb + medium + webp 4종을 R2로 동기화. setImmediate로 분리해
  // 응답 차단 안 함. img.upstay.co.kr Custom Domain이 이걸 서빙.
  setImmediate(() => {
    syncVariantsToR2(originalPath).catch((e) =>
      logError("upload", "R2 variants sync 실패", e, { filename }),
    );
  });
  // AVIF (가장 무거움) — setImmediate로 분리해 응답 차단 안 함.
  // 생성 완료 후 R2에도 동기화.
  setImmediate(() => {
    const tAvif = Date.now();
    sharp(originalPath, sharpOpts)
      .avif({ quality: 80 })
      .toFile(`${originalPath}.avif`)
      .then(() => {
        logInfo("upload", "avif 백그라운드 완료", {
          filename,
          ms: Date.now() - tAvif,
        });
        return syncToR2(`${originalPath}.avif`, `${filename}.avif`);
      })
      .catch((e) =>
        logWarn("upload", "avif 백그라운드 실패", {
          filename,
          err: (e as Error).message,
        }),
      );
  });
}

export async function POST(req: NextRequest) {
  const reqStart = Date.now();
  if (!(await verifyToken(req))) {
    logWarn("upload", "인증 실패", { ip: req.headers.get("cf-connecting-ip") });
    return unauthorized();
  }

  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
    logInfo("upload", "UPLOAD_DIR 생성", { dir: UPLOAD_DIR });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch (e) {
    logError("upload", "formData 파싱 실패", e);
    return Response.json(
      { error: ErrorMessages.uploadAllFailed("파일을 읽지 못했습니다") },
      { status: 400 },
    );
  }
  const files = formData.getAll("files") as File[];

  if (files.length === 0) {
    return Response.json({ error: "사진을 선택해주세요" }, { status: 400 });
  }

  const MAX_FILES_PER_REQUEST = 20;
  if (files.length > MAX_FILES_PER_REQUEST) {
    return Response.json(
      { error: ErrorMessages.uploadTooManyFiles(MAX_FILES_PER_REQUEST) },
      { status: 400 },
    );
  }

  const totalBytes = files.reduce((s, f) => s + f.size, 0);
  logInfo("upload", "요청 시작", {
    count: files.length,
    totalMB: (totalBytes / 1024 / 1024).toFixed(1),
  });

  const saved: string[] = [];

  for (const file of files) {
    const fileStart = Date.now();
    const sizeMB = file.size / 1024 / 1024;

    if (file.size > 20 * 1024 * 1024) {
      logWarn("upload", "파일 크기 초과", {
        filename: file.name,
        sizeMB: sizeMB.toFixed(1),
      });
      return Response.json(
        { error: ErrorMessages.uploadFileTooLarge(file.name, Math.ceil(sizeMB)) },
        { status: 400 },
      );
    }

    const ext = path.extname(file.name).toLowerCase() || ".jpg";
    const ALLOWED_EXT = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
    if (!ALLOWED_EXT.includes(ext)) {
      logWarn("upload", "허용되지 않는 확장자", {
        filename: file.name,
        ext,
      });
      return Response.json(
        { error: ErrorMessages.uploadFileBadType(file.name) },
        { status: 400 },
      );
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    if (!checkMagic(buffer, ext)) {
      logWarn("upload", "magic number 불일치", {
        filename: file.name,
        ext,
      });
      return Response.json(
        { error: ErrorMessages.uploadFileBadType(file.name) },
        { status: 400 },
      );
    }
    const MAX_PIXELS = 100_000_000;
    try {
      const meta = await sharp(buffer, { failOn: "none" }).metadata();
      const pixels = (meta.width ?? 0) * (meta.height ?? 0);
      if (pixels > MAX_PIXELS) {
        logWarn("upload", "픽셀 한도 초과", {
          filename: file.name,
          pixels,
          dim: `${meta.width}x${meta.height}`,
        });
        return Response.json(
          { error: ErrorMessages.uploadPixelTooLarge(file.name) },
          { status: 400 },
        );
      }
    } catch (e) {
      logWarn("upload", "metadata 측정 실패 (계속 진행)", {
        filename: file.name,
        err: (e as Error).message,
      });
    }
    let optimizedBuffer: Buffer;
    try {
      optimizedBuffer = await optimize(buffer, ext);
    } catch (e) {
      logWarn("upload", "sharp 최적화 실패, 원본 저장", {
        filename: file.name,
        err: (e as Error).message,
      });
      optimizedBuffer = buffer;
    }
    const filename = `${Date.now()}-${randomBytes(8).toString("hex")}${ext}`;
    const savedPath = path.join(UPLOAD_DIR, filename);
    await writeFile(savedPath, optimizedBuffer);
    saved.push(filename);
    logInfo("upload", "1장 저장 완료", {
      filename,
      original: file.name,
      sizeMB: sizeMB.toFixed(1),
      durationMs: Date.now() - fileStart,
    });
    if (ext !== ".gif") {
      precomputeVariants(savedPath).catch((e) =>
        logError("upload", "variants 생성 실패", e, { filename }),
      );
    } else {
      // gif는 variants를 만들지 않음 — 원본만 R2 sync.
      setImmediate(() => {
        syncToR2(savedPath, filename).catch((e) =>
          logError("upload", "R2 gif sync 실패", e, { filename }),
        );
      });
    }
  }

  logInfo("upload", "요청 완료", {
    count: saved.length,
    durationMs: Date.now() - reqStart,
  });

  return Response.json({
    files: saved,
    urls: saved.map((f) => `/api/uploads/${f}`),
  });
}
