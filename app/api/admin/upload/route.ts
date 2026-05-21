import { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { randomBytes } from "crypto";
import path from "path";
import sharp from "sharp";
import { verifyToken, unauthorized } from "@/lib/auth";
import { UPLOAD_DIR } from "@/lib/paths";

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

export async function POST(req: NextRequest) {
  if (!(await verifyToken(req))) return unauthorized();

  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }

  const formData = await req.formData();
  const files = formData.getAll("files") as File[];

  if (files.length === 0) {
    return Response.json({ error: "No files" }, { status: 400 });
  }

  const saved: string[] = [];

  for (const file of files) {
    if (file.size > 20 * 1024 * 1024) {
      return Response.json(
        { error: `${file.name} exceeds 20MB` },
        { status: 400 },
      );
    }

    const ext = path.extname(file.name).toLowerCase() || ".jpg";
    const ALLOWED_EXT = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
    if (!ALLOWED_EXT.includes(ext)) {
      return Response.json(
        { error: `${file.name}: 허용되지 않는 파일 형식` },
        { status: 400 },
      );
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    if (!checkMagic(buffer, ext)) {
      return Response.json(
        { error: `${file.name}: 파일 내용이 확장자와 일치하지 않습니다` },
        { status: 400 },
      );
    }
    // 픽셀 사전 측정 — 압축률 높인 거대 이미지(예: 200MP를 18MB JPEG로)가
    // file.size 가드를 통과해도 sharp 디코딩에서 ~수백 MB 메모리 점유로 OOM 유도 가능.
    // gif는 sharp 최적화를 건너뛰는 경로라 메타만 살핀다.
    const MAX_PIXELS = 100_000_000; // 100MP (iPhone 48MP·갤럭시 200MP의 안전 한도)
    try {
      const meta = await sharp(buffer, { failOn: "none" }).metadata();
      const pixels = (meta.width ?? 0) * (meta.height ?? 0);
      if (pixels > MAX_PIXELS) {
        return Response.json(
          { error: `${file.name}: 이미지 해상도가 너무 큽니다 (최대 100MP)` },
          { status: 400 },
        );
      }
    } catch {
      // metadata 자체가 실패하면 후속 optimize에서 처리. 여기선 게이트 통과.
    }
    let optimizedBuffer: Buffer;
    try {
      optimizedBuffer = await optimize(buffer, ext);
    } catch (e) {
      console.warn(
        "[upload] sharp 최적화 실패, 원본 저장:",
        (e as Error).message,
      );
      optimizedBuffer = buffer;
    }
    const filename = `${Date.now()}-${randomBytes(8).toString("hex")}${ext}`;
    await writeFile(path.join(UPLOAD_DIR, filename), optimizedBuffer);
    saved.push(filename);
  }

  return Response.json({
    files: saved,
    urls: saved.map((f) => `/api/uploads/${f}`),
  });
}
