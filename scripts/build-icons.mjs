// 메타 아이콘 일괄 생성 스크립트
// - app/icon.png, app/apple-icon.png, app/icon.svg
// - public/icon-192.png, public/icon-512.png (maskable; Android Chrome 홈 화면)
// - public/og-image.png (1200x630, SNS 미리보기 표준 비율)
//
// 실행: node scripts/build-icons.mjs
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.join(ROOT, "public/logo.svg");

const BG = { r: 241, g: 248, b: 233, alpha: 1 }; // #F1F8E9 — 헤더 배경과 동일

async function withCanvas(width, height, background, content) {
  return sharp({
    create: { width, height, channels: 4, background },
  })
    .composite(content)
    .png();
}

async function makeContain(size, file, { background = BG, padding = 0.15 } = {}) {
  // 로고가 가로형(2:1)이라 정사각형에 contain. padding으로 안전 영역.
  const inner = Math.round(size * (1 - padding * 2));
  const inset = Math.round((size - inner) / 2);
  const innerBuf = await sharp(SRC)
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  await (
    await withCanvas(size, size, background, [{ input: innerBuf, top: inset, left: inset }])
  ).toFile(file);
  console.log("✓", path.relative(ROOT, file));
}

async function makeMaskable(size, file) {
  // Android maskable: 가운데 80%만 안전. 패딩 20%.
  await makeContain(size, file, { padding: 0.2 });
}

async function makeOgImage(file) {
  // 1200x630 OG 표준. 가운데에 로고(600x300 영역).
  const inner = await sharp(SRC)
    .resize(600, 300, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  await (
    await withCanvas(1200, 630, BG, [{ input: inner, top: 165, left: 300 }])
  ).toFile(file);
  console.log("✓", path.relative(ROOT, file));
}

async function main() {
  await fs.copyFile(SRC, path.join(ROOT, "app/icon.svg"));
  console.log("✓ app/icon.svg (copy of logo.svg)");

  await makeContain(32, path.join(ROOT, "app/icon.png"));
  await makeContain(180, path.join(ROOT, "app/apple-icon.png"));

  await makeMaskable(192, path.join(ROOT, "public/icon-192.png"));
  await makeMaskable(512, path.join(ROOT, "public/icon-512.png"));

  await makeOgImage(path.join(ROOT, "public/og-image.png"));

  console.log("\n로고 메타 자산 생성 완료.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
