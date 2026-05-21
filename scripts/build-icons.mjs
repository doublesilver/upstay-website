// 메타 아이콘 일괄 생성 스크립트
// - app/icon.png(32), app/apple-icon.png(180), app/icon.svg (favicon/iOS)
// - public/icon-192.png, public/icon-512.png  (purpose=any; 사각 마스크 OS용)
// - public/icon-maskable-192.png, public/icon-maskable-512.png  (purpose=maskable;
//                                                                안전영역 80%)
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

// 한 번만 로드 — 로고 SVG를 큰 PNG로 렌더 후 trim해서 실제 그래픽 영역만 추출.
// 이렇게 하면 SVG viewBox의 미세 여백까지 제거되어 글자가 캔버스에 더 크게 들어감.
let trimmedLogoBufCache = null;
async function getTrimmedLogoBuf() {
  if (trimmedLogoBufCache) return trimmedLogoBufCache;
  const big = await sharp(SRC)
    .resize(2048, null, { fit: "inside" })
    .png()
    .toBuffer();
  trimmedLogoBufCache = await sharp(big).trim().png().toBuffer();
  return trimmedLogoBufCache;
}

async function makeContain(size, file, { background = BG, padding = 0.15 } = {}) {
  // 로고가 가로형(2:1)이라 정사각형에 contain. padding으로 안전 영역.
  // trim된 로고를 사용해 SVG 자체의 미세 여백까지 제거.
  const logoBuf = await getTrimmedLogoBuf();
  const inner = Math.max(1, Math.round(size * (1 - padding * 2)));
  const innerBuf = await sharp(logoBuf)
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  // 가로형 로고가 안에 contain된 결과의 실제 높이를 측정해 세로 가운데 정렬.
  const innerMeta = await sharp(innerBuf).metadata();
  const top = Math.round((size - (innerMeta.height ?? inner)) / 2);
  const left = Math.round((size - (innerMeta.width ?? inner)) / 2);
  await (
    await withCanvas(size, size, background, [{ input: innerBuf, top, left }])
  ).toFile(file);
  console.log("✓", path.relative(ROOT, file));
}

// 일반 (purpose: any) — 사각 마스크 OS에서 거의 풀사이즈. padding 5%만 두어
// 외곽 다 보이게.
async function makeAnyIcon(size, file) {
  await makeContain(size, file, { padding: 0.05 });
}

// Maskable (purpose: maskable) — Android Chrome 등 원/사각/물방울 마스크.
// 표준 안전 영역 80%를 살짝 안쪽까지 사용해 가능한 한 크게.
async function makeMaskable(size, file) {
  await makeContain(size, file, { padding: 0.1 });
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

  // 파비콘 + Apple touch icon: 사각 마스크라 패딩 15% 유지가 시각적으로 자연스러움.
  await makeContain(32, path.join(ROOT, "app/icon.png"));
  await makeContain(180, path.join(ROOT, "app/apple-icon.png"));

  // 일반(any) PWA 아이콘 — 사각 마스크 OS에서 거의 풀사이즈.
  await makeAnyIcon(192, path.join(ROOT, "public/icon-192.png"));
  await makeAnyIcon(512, path.join(ROOT, "public/icon-512.png"));

  // Maskable PWA 아이콘 — 안전 영역(80%) 한계까지 사용. 어떤 마스크에도 잘림 없음.
  await makeMaskable(192, path.join(ROOT, "public/icon-maskable-192.png"));
  await makeMaskable(512, path.join(ROOT, "public/icon-maskable-512.png"));

  // 외부 메신저(카카오톡·Slack·페이스북) OG 캐시 무효화 위해 버전드 파일명 사용.
  // 로고 갱신 시마다 v 번호 올려 새 URL로 만들면 캐시 우회.
  await makeOgImage(path.join(ROOT, "public/og-image-v2.png"));

  console.log("\n로고 메타 자산 생성 완료.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
