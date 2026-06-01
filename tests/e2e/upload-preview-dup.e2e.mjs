// e2e 재현·검증: 관리자 사진 업로드 시 "미리보기 중복(N장 → 2N장)" 시각 버그 회귀 방지.
//
// 격리 원칙(실서버·실DB·실 env 절대 비접촉):
//  - 임시 DATA_DIR(별도 SQLite + uploads)에서만 동작 → 끝나면 통째로 삭제.
//  - 로컬 전용 ADMIN_ID/ADMIN_PW/JWT_SECRET을 이 프로세스 환경에만 주입(노출 없음).
//  - 비어있는 무작위 포트에 next dev 기동(StrictMode 켜진 dev 환경 — 이중 effect 재현).
//
// 검증 핵심:
//  ① 업로드 진행 중 "화면에 보이는 이미지 총수(큐 카드 + 갤러리 썸네일)"가
//     선택한 장수 N을 절대 초과하지 않는다(= 13장이 26장으로 안 보인다).
//  ② 완료 후 갤러리에 정확히 N장, 중복 0.
//  ③ 5장·1장 교차로 회귀 없음 확인.

import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import net from "node:net";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..", "..");

// ── 로컬 전용 자격증명(이 프로세스 환경에만 존재, 로그·산출물에 미노출) ──
const LOCAL_ADMIN_ID = "e2e-admin";
const LOCAL_ADMIN_PW = "e2e-local-pw-" + Math.random().toString(36).slice(2);
const LOCAL_JWT_SECRET = "e2e-local-jwt-secret-min-32-bytes-padding-xxxxx";

function log(...args) {
  console.log("[e2e]", ...args);
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

async function waitForServer(baseUrl, timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(baseUrl + "/admin", { redirect: "manual" });
      if (res.status > 0) return;
    } catch {
      /* 아직 부팅 중 */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("dev 서버가 제한시간 내에 뜨지 않음");
}

async function makeTestImages(dir, n) {
  const files = [];
  for (let i = 0; i < n; i++) {
    // 장마다 색을 달리해 실제로 서로 다른 파일이 되도록(중복 판정 신뢰).
    const r = (i * 37) % 256;
    const g = (i * 71) % 256;
    const b = (i * 113) % 256;
    const buf = await sharp({
      create: {
        width: 320,
        height: 240,
        channels: 3,
        background: { r, g, b },
      },
    })
      .jpeg()
      .toBuffer();
    const fp = path.join(dir, `test-${String(i + 1).padStart(2, "0")}.jpg`);
    writeFileSync(fp, buf);
    files.push(fp);
  }
  return files;
}

// 화면에 "실제로 보이는" 이미지 총수 = 진행 중인 큐 카드 + 갤러리 썸네일.
// done 카드는 갤러리 반영 직후 제거되어야 하므로, 둘의 합이 N을 넘으면 중복 버그.
//
// 시나리오마다 새 박스를 만들고 그 박스의 BEFORE 섹션에만 업로드하므로,
// 계측은 "업로드 대상 섹션(scopeSelector)" 안으로 한정한다 — 이전 박스의 썸네일이
// 누적돼 카운트를 오염시키지 않도록.
async function countVisibleImages(page, scopeSelector) {
  return await page.evaluate((sel) => {
    const isVisible = (el) => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    };
    const scope = document.querySelector(sel);
    if (!scope) return { cards: 0, thumbs: 0, total: 0 };
    const cards = Array.from(
      scope.querySelectorAll('[data-testid="upload-queue-card"]'),
    ).filter(isVisible);
    const thumbs = Array.from(
      scope.querySelectorAll('[data-testid="gallery-thumb"]'),
    ).filter(isVisible);
    return {
      cards: cards.length,
      thumbs: thumbs.length,
      total: cards.length + thumbs.length,
    };
  }, scopeSelector);
}

async function runScenario(page, baseUrl, imageDir, n, label) {
  log(`── 시나리오 [${label}] ${n}장 ──`);

  // 사례(박스) 1개 생성. 생성 후 BEFORE 섹션 file input이 뜰 때까지 대기.
  const inputsBefore = await page.locator('input[type="file"]').count();
  await page.click('button:has-text("박스 추가")');
  await page.waitForFunction(
    (prev) => document.querySelectorAll('input[type="file"]').length > prev,
    inputsBefore,
    { timeout: 20_000 },
  );

  const files = await makeTestImages(imageDir, n);

  // 새 draft 박스는 목록 맨 위 "새로 추가된 박스" 영역에 렌더되므로 첫 박스의
  // BEFORE 섹션이 방금 만든 업로드 대상. 계측·파일주입을 이 섹션으로 한정.
  const scopeSelector =
    '[data-testid="image-section"][data-section-type="before"]';
  await page.waitForSelector(scopeSelector, { timeout: 20_000 });
  const beforeSection = page.locator(scopeSelector).first();
  const fileInput = beforeSection.locator('input[type="file"]').first();
  await fileInput.setInputFiles(files);

  // 업로드 진행 동안 보이는 총수를 촘촘히 폴링 — N 초과(=중복) 즉시 실패.
  let maxTotalSeen = 0;
  let maxCardsSeen = 0;
  let maxThumbsSeen = 0;
  const pollDeadline = Date.now() + 60_000;
  let settled = false;
  while (Date.now() < pollDeadline) {
    const c = await countVisibleImages(page, scopeSelector);
    maxTotalSeen = Math.max(maxTotalSeen, c.total);
    maxCardsSeen = Math.max(maxCardsSeen, c.cards);
    maxThumbsSeen = Math.max(maxThumbsSeen, c.thumbs);

    if (c.total > n) {
      throw new Error(
        `[${label}] 중복 표시 감지! 보이는 총수=${c.total} (큐카드 ${c.cards} + 갤러리 ${c.thumbs}) > 기대 ${n}`,
      );
    }
    // 업로드 완료 = 큐 카드 0 + 갤러리 N장.
    if (c.cards === 0 && c.thumbs === n) {
      settled = true;
      break;
    }
    await new Promise((r) => setTimeout(r, 60));
  }

  if (!settled) {
    const c = await countVisibleImages(page);
    throw new Error(
      `[${label}] 제한시간 내 미완료: 큐카드 ${c.cards}, 갤러리 ${c.thumbs} (기대 갤러리 ${n})`,
    );
  }

  // 잠깐 더 관찰해 늦은 중복 카드가 안 뜨는지 확인(이전 버그는 1.5초 잔류였음).
  for (let i = 0; i < 30; i++) {
    const c = await countVisibleImages(page);
    if (c.total > n) {
      throw new Error(
        `[${label}] 완료 직후 늦은 중복! 총수=${c.total} > ${n}`,
      );
    }
    await new Promise((r) => setTimeout(r, 60));
  }

  log(
    `[${label}] OK — 진행 중 최대 총수 ${maxTotalSeen} (≤ ${n}), 최대 큐카드 ${maxCardsSeen}, 최종 갤러리 ${n}장 중복0`,
  );

  return { maxTotalSeen, maxCardsSeen, maxThumbsSeen };
}

async function main() {
  const dataDir = mkdtempSync(path.join(tmpdir(), "upstay-e2e-data-"));
  const imageDir = mkdtempSync(path.join(tmpdir(), "upstay-e2e-img-"));
  mkdirSync(path.join(dataDir, "uploads"), { recursive: true });

  const port = await getFreePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  log("격리 DATA_DIR:", dataDir);
  log("dev 서버 포트:", port);

  let server;
  let browser;
  let failed = null;
  try {
    server = spawn(
      "npx",
      ["next", "dev", "--port", String(port), "--hostname", "127.0.0.1"],
      {
        cwd: PROJECT_ROOT,
        env: {
          ...process.env,
          DATA_DIR: dataDir,
          ADMIN_ID: LOCAL_ADMIN_ID,
          ADMIN_PW: LOCAL_ADMIN_PW,
          JWT_SECRET: LOCAL_JWT_SECRET,
          // CSRF allowlist(middleware) — admin POST/PUT/DELETE의 Origin 검증 통과용.
          // 127.0.0.1·localhost 둘 다 허용해 dev 라우팅이 어느 쪽으로 normalize 돼도 안전.
          PUBLIC_ORIGIN: `${baseUrl},http://localhost:${port}`,
          NODE_ENV: "development",
        },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    server.stdout.on("data", (d) => {
      const s = d.toString();
      if (/error|warn/i.test(s)) process.stdout.write("[next] " + s);
    });
    server.stderr.on("data", (d) => process.stderr.write("[next:err] " + d));

    await waitForServer(baseUrl);
    log("dev 서버 준비 완료");

    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    page.on("pageerror", (e) => log("PAGE ERROR:", e.message));

    // ── 로그인 ──
    await page.goto(baseUrl + "/admin", { waitUntil: "networkidle" });
    await page.fill('input[name="id"]', LOCAL_ADMIN_ID);
    await page.fill('input[name="password"]', LOCAL_ADMIN_PW);
    await Promise.all([
      page.waitForURL("**/admin/remodeling", { timeout: 20_000 }),
      page.click('button[type="submit"]'),
    ]);
    await page.waitForSelector('button:has-text("박스 추가")', {
      timeout: 20_000,
    });
    log("로그인 성공 → 사진등록 페이지 진입");

    // ★ 핵심: 13장. 그리고 회귀 교차로 5장·1장.
    await runScenario(page, baseUrl, imageDir, 13, "13장 (핵심)");
    // 새 박스에서 다시 — 이전 박스 영향 없이 독립 검증.
    await runScenario(page, baseUrl, imageDir, 5, "5장");
    await runScenario(page, baseUrl, imageDir, 1, "1장");

    log("✅ 전체 시나리오 통과 — 미리보기 중복 없음, 총수 항상 정확");
  } catch (e) {
    failed = e;
    log("❌ 실패:", e.message);
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (server) {
      server.kill("SIGTERM");
      await new Promise((r) => setTimeout(r, 1500));
      if (!server.killed) server.kill("SIGKILL");
    }
    // 격리 데이터 정리.
    rmSync(dataDir, { recursive: true, force: true });
    rmSync(imageDir, { recursive: true, force: true });
    log("격리 데이터 정리 완료");
  }

  if (failed) process.exit(1);
  process.exit(0);
}

main();
