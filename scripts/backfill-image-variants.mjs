#!/usr/bin/env node
// 일회성 운영 스크립트:
// 기존 업로드 사진(JPG/PNG/WebP) 옆에 .webp / .avif 사본을 추가 생성.
//
// 안전망:
// 1. 원본 파일은 read-only로만 접근 (sharp 출력은 별도 경로 .webp/.avif)
// 2. 이미 사본 있으면 skip (중복 실행 안전)
// 3. 한 장 실패해도 다음 파일 진행 (배치 중단 방지)
// 4. --dry-run으로 처리 대상 미리 확인 가능
//
// 실행:
//   railway ssh
//   cd /app && node scripts/backfill-image-variants.mjs --dry-run   # 미리보기
//   cd /app && node scripts/backfill-image-variants.mjs             # 실제 실행

import { readdir, access } from "fs/promises";
import { constants } from "fs";
import path from "path";
import sharp from "sharp";

const DATA_DIR = process.env.DATA_DIR || "/data";
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
const DRY_RUN = process.argv.includes("--dry-run");

const ORIGINAL_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const VARIANT_EXTS = new Set([".webp", ".avif"]);
const SHARP_OPTS = { limitInputPixels: 100_000_000, failOn: "truncated" };

async function fileExists(p) {
  try {
    await access(p, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

// 사본(foo.jpg.webp, foo.jpg.avif)을 원본 후보에서 배제.
// 우리가 만드는 사본은 stem이 또 .jpg/.png로 끝나므로 inner extname이 ORIGINAL_EXTS에 속함.
function isOriginal(name) {
  const ext = path.extname(name).toLowerCase();
  if (!ORIGINAL_EXTS.has(ext)) return false;
  if (VARIANT_EXTS.has(ext)) {
    const stem = path.basename(name, ext);
    const innerExt = path.extname(stem).toLowerCase();
    if (innerExt && ORIGINAL_EXTS.has(innerExt)) return false;
  }
  return true;
}

async function main() {
  console.log(`[backfill] UPLOAD_DIR: ${UPLOAD_DIR}`);
  console.log(`[backfill] dry-run: ${DRY_RUN}`);
  console.log("");

  let names;
  try {
    names = await readdir(UPLOAD_DIR);
  } catch (e) {
    console.error(`[backfill] UPLOAD_DIR 읽기 실패: ${e.message}`);
    process.exit(1);
  }
  const originals = names.filter(isOriginal);
  console.log(
    `[backfill] 원본 후보: ${originals.length}장 (총 ${names.length}개 파일 중)`,
  );
  console.log("");

  let processed = 0;
  let created = 0;
  let skipped = 0;
  let failed = 0;

  // CPU 1코어 Railway 환경 가정 — 직렬 처리로 응답 영향 최소화.
  for (const name of originals) {
    processed++;
    const full = path.join(UPLOAD_DIR, name);
    const ext = path.extname(name).toLowerCase();

    const tasks = [];
    // 원본이 .webp면 webp 사본은 불필요 (서빙 라우트가 webp 원본 그대로 streaming).
    if (ext !== ".webp" && !(await fileExists(`${full}.webp`))) {
      tasks.push("webp");
    }
    if (!(await fileExists(`${full}.avif`))) {
      tasks.push("avif");
    }

    if (tasks.length === 0) {
      skipped++;
      continue;
    }

    console.log(
      `[${processed}/${originals.length}] ${name} → ${tasks.join("+")}`,
    );

    if (DRY_RUN) {
      created += tasks.length;
      continue;
    }

    try {
      await Promise.all(
        tasks.map((fmt) =>
          fmt === "avif"
            ? sharp(full, SHARP_OPTS)
                .avif({ quality: 80 })
                .toFile(`${full}.avif`)
            : sharp(full, SHARP_OPTS)
                .webp({ quality: 80 })
                .toFile(`${full}.webp`),
        ),
      );
      created += tasks.length;
    } catch (e) {
      failed++;
      console.warn(`  ✗ 실패: ${e.message}`);
    }
  }

  console.log("");
  console.log("[backfill] 완료");
  console.log(`  처리: ${processed}장`);
  console.log(
    `  생성: ${created}개 사본${DRY_RUN ? " (dry-run, 실제 생성 안 함)" : ""}`,
  );
  console.log(`  skip: ${skipped}장 (이미 사본 존재)`);
  console.log(`  실패: ${failed}장`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
