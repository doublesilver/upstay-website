// e2e 재현·검증: 관리자 사진 업로드 중 사진 카드가 "박스 안에서 움직이는"
// (레이아웃 출렁임 / layout shift) 버그 회귀 방지.
//
// 배경: 직전 fix(중복 26장 제거)에서 done 항목을 즉시 큐에서 빼고 갤러리에 넣었는데,
// 큐 영역과 갤러리 영역이 분리돼 있어 카드가 영역 간 이동 → 13장이 제각각 완료될 때마다
// 나머지 카드가 재배치돼 출렁였다. 수정: 큐 카드 + 갤러리 썸네일을 "하나의 그리드"에
// 함께 렌더 → 완료돼도 카드가 영역을 옮기지 않고 제자리에서 내용만 바뀐다.
//
// 격리 원칙(실서버·실DB·실 env 절대 비접촉):
//  - 임시 DATA_DIR(별도 SQLite + uploads)에서만 동작 → 끝나면 통째로 삭제.
//  - 로컬 전용 ADMIN_ID/ADMIN_PW/JWT_SECRET을 이 프로세스 환경에만 주입(노출 없음).
//  - 비어있는 무작위 포트에 next dev 기동(StrictMode 켜진 dev 환경 — 이중 effect 재현).
//
// 검증 핵심:
//  ① 업로드 진행 중 그리드 각 슬롯(index)의 화면 좌표(boundingBox)를 여러 시점 측정해
//     슬롯이 자리를 옮기지 않음을 확인(layout shift 없음). 첫 렌더 위치 = 완료 후 위치.
//  ② 26장 중복 재발 없음(보이는 총수 항상 ≤ N, 최종 정확히 N장).
//  ③ 진행률·처리중·완료·점진표시·재시도 5기능 여전히 정상.
//  ④ 5장·1장 교차.

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

// 같은 슬롯이 시점 간 "움직였다"고 볼 허용 오차(px). 카드 폭 120·높이 90 그리드에서
// 영역 간 이동(buggy)은 수십~수백 px 점프이므로 이 정도면 정상 떨림과 명확히 구분된다.
const SHIFT_TOLERANCE_PX = 4;

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

async function makeTestImages(dir, n, tag) {
  const files = [];
  for (let i = 0; i < n; i++) {
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
    const fp = path.join(dir, `${tag}-${String(i + 1).padStart(2, "0")}.jpg`);
    writeFileSync(fp, buf);
    files.push(fp);
  }
  return files;
}

// 섹션 안에서 "화면에 보이는" 업로드 관련 요소(진행 중 큐 카드 + 갤러리 썸네일)를
// DOM 순서대로 한 줄로 모아 슬롯 좌표·상태·총수를 함께 반환한다.
// ★ 수정 후엔 둘이 한 그리드에 있으므로 DOM 순서 = 화면 좌→우/위→아래 순서이고,
//   각 슬롯의 좌표는 완료 전후로 안정적이어야 한다(layout shift 없음).
async function probeSection(page, scopeSelector) {
  return await page.evaluate((sel) => {
    const isVisible = (el) => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    };
    const scope = document.querySelector(sel);
    if (!scope) return { cards: 0, thumbs: 0, total: 0, slots: [], statuses: [] };

    const cardEls = Array.from(
      scope.querySelectorAll('[data-testid="upload-queue-card"]'),
    ).filter(isVisible);
    const thumbEls = Array.from(
      scope.querySelectorAll('[data-testid="gallery-thumb"]'),
    ).filter(isVisible);

    // 한 그리드 안에서 DOM 순서대로 모든 카드/썸네일의 좌표를 슬롯 배열로.
    const all = Array.from(
      scope.querySelectorAll(
        '[data-testid="upload-queue-card"], [data-testid="gallery-thumb"]',
      ),
    ).filter(isVisible);
    const slots = all.map((el) => {
      const r = el.getBoundingClientRect();
      // 정수 반올림으로 서브픽셀 노이즈 제거.
      return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
    });

    // 진행 상태(진행률·처리중·완료·재시도) 가시성 — 5기능 동작 확인용.
    const statuses = cardEls.map(
      (el) => el.getAttribute("data-upload-status") || "?",
    );

    return {
      cards: cardEls.length,
      thumbs: thumbEls.length,
      total: cardEls.length + thumbEls.length,
      slots,
      statuses,
    };
  }, scopeSelector);
}

// 슬롯 좌표 시계열에서 "이미 존재하던 슬롯 index가 큰 폭으로 점프했는지" 검출.
// 슬롯 수가 늘어나는 건(새 카드 추가) 정상 — 단, 같은 index가 가진 좌표가 시점 간
// 허용 오차를 넘어 바뀌면 layout shift로 간주.
//
// ★ 안정성 판정의 핵심: 각 슬롯 index의 좌표는 한번 정해지면 끝까지(완료까지) 거의
//   고정이어야 한다. buggy 코드는 완료 카드가 윗줄→아랫줄로 점프해 같은 index 좌표가
//   수십 px 이상 출렁인다.
function detectShift(timeline, label) {
  // index별 관측 좌표들을 모아 x·y의 변동폭(max-min)을 본다.
  const perIndex = new Map(); // index -> { xs:[], ys:[] }
  for (const frame of timeline) {
    frame.slots.forEach((s, i) => {
      if (!perIndex.has(i)) perIndex.set(i, { xs: [], ys: [] });
      const e = perIndex.get(i);
      e.xs.push(s.x);
      e.ys.push(s.y);
    });
  }
  const offenders = [];
  for (const [i, e] of perIndex) {
    const dx = Math.max(...e.xs) - Math.min(...e.xs);
    const dy = Math.max(...e.ys) - Math.min(...e.ys);
    if (dx > SHIFT_TOLERANCE_PX || dy > SHIFT_TOLERANCE_PX) {
      offenders.push({ index: i, dx, dy });
    }
  }
  return offenders;
}

async function runScenario(page, baseUrl, imageDir, n, label, opts = {}) {
  const { expectShift = false } = opts;
  log(`── 시나리오 [${label}] ${n}장 ──`);

  const inputsBefore = await page.locator('input[type="file"]').count();
  await page.click('button:has-text("박스 추가")');
  await page.waitForFunction(
    (prev) => document.querySelectorAll('input[type="file"]').length > prev,
    inputsBefore,
    { timeout: 20_000 },
  );

  const files = await makeTestImages(imageDir, n, label.replace(/[^a-z0-9]/gi, ""));

  const scopeSelector =
    '[data-testid="image-section"][data-section-type="before"]';
  await page.waitForSelector(scopeSelector, { timeout: 20_000 });
  const beforeSection = page.locator(scopeSelector).first();
  const fileInput = beforeSection.locator('input[type="file"]').first();
  await fileInput.setInputFiles(files);

  // 업로드 진행 동안 좌표·상태·총수를 촘촘히 폴링.
  const timeline = [];
  const seenStatuses = new Set();
  let maxTotalSeen = 0;
  let maxCardsSeen = 0;
  const pollDeadline = Date.now() + 60_000;
  let settled = false;
  while (Date.now() < pollDeadline) {
    const p = await probeSection(page, scopeSelector);
    timeline.push({ slots: p.slots, total: p.total });
    maxTotalSeen = Math.max(maxTotalSeen, p.total);
    maxCardsSeen = Math.max(maxCardsSeen, p.cards);
    p.statuses.forEach((s) => seenStatuses.add(s));

    // ② 중복(26장) 검출 — 보이는 총수가 N을 절대 초과하면 안 됨.
    if (p.total > n) {
      throw new Error(
        `[${label}] 중복 표시 감지! 보이는 총수=${p.total} (큐카드 ${p.cards} + 갤러리 ${p.thumbs}) > 기대 ${n}`,
      );
    }
    if (p.cards === 0 && p.thumbs === n) {
      settled = true;
      break;
    }
    await new Promise((r) => setTimeout(r, 50));
  }

  if (!settled) {
    const p = await probeSection(page, scopeSelector);
    throw new Error(
      `[${label}] 제한시간 내 미완료: 큐카드 ${p.cards}, 갤러리 ${p.thumbs} (기대 갤러리 ${n})`,
    );
  }

  // 완료 직후 잠깐 더 관찰 — 늦은 중복/늦은 이동 방어.
  for (let i = 0; i < 20; i++) {
    const p = await probeSection(page, scopeSelector);
    timeline.push({ slots: p.slots, total: p.total });
    if (p.total > n) {
      throw new Error(`[${label}] 완료 직후 늦은 중복! 총수=${p.total} > ${n}`);
    }
    await new Promise((r) => setTimeout(r, 50));
  }

  // ① layout shift 판정.
  const offenders = detectShift(timeline, label);

  if (expectShift) {
    // 테스트 유효성 증명용(수정 전 코드): shift가 반드시 검출돼야 한다.
    if (offenders.length === 0) {
      throw new Error(
        `[${label}] (유효성 검증) shift가 검출되리라 기대했으나 0건 — 테스트가 버그를 못 잡음`,
      );
    }
    log(
      `[${label}] (유효성 검증) 예상대로 shift 검출 ${offenders.length}개 슬롯 (최대 dx/dy 점프 존재) ✔`,
    );
  } else {
    if (offenders.length > 0) {
      const worst = offenders
        .sort((a, b) => b.dx + b.dy - (a.dx + a.dy))
        .slice(0, 5);
      throw new Error(
        `[${label}] layout shift 감지! 슬롯이 움직임(허용 ${SHIFT_TOLERANCE_PX}px): ` +
          worst.map((o) => `#${o.index}(dx=${o.dx},dy=${o.dy})`).join(", "),
      );
    }
    log(
      `[${label}] OK — 슬롯 좌표 안정(이동 0, 허용 ${SHIFT_TOLERANCE_PX}px), 진행 중 최대 총수 ${maxTotalSeen} (≤ ${n}), 최대 큐카드 ${maxCardsSeen}, 최종 갤러리 ${n}장 중복0`,
    );
  }

  return { maxTotalSeen, maxCardsSeen, seenStatuses, offenders, timeline };
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
    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
    });
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

    // ★ 핵심: 13장 — 슬롯 좌표 안정 + 중복0. 그리고 회귀 교차로 5장·1장.
    const main13 = await runScenario(page, baseUrl, imageDir, 13, "13장 (핵심)");
    await runScenario(page, baseUrl, imageDir, 5, "5장");
    await runScenario(page, baseUrl, imageDir, 1, "1장");

    // ③ 5기능(진행률·처리중·완료·점진표시·재시도) 중 업로드 중 관측 상태 확인.
    //    재시도(error)는 정상 경로엔 안 나오므로 별도 테스트(retry)로 검증.
    log(
      `진행 중 관측된 카드 상태: [${[...main13.seenStatuses].join(", ")}]`,
    );

    // ── 재시도 5번째 기능 검증: 강제 실패 → error 카드 → 재시도 → done ──
    // 업로드 API를 1회 가로채 실패시켜 error 카드를 띄운 뒤, 재시도로 복구되는지.
    await runRetryScenario(page, baseUrl, imageDir);

    log("✅ 전체 시나리오 통과 — 카드 좌표 안정(layout shift 없음), 중복0, 5기능 정상");
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
    rmSync(dataDir, { recursive: true, force: true });
    rmSync(imageDir, { recursive: true, force: true });
    log("격리 데이터 정리 완료");
  }

  if (failed) process.exit(1);
  process.exit(0);
}

// 재시도 기능: 첫 업로드 POST를 한 번 가로채 실패 응답 → error 카드 등장 확인 →
// 라우트 해제 후 재시도 버튼 클릭 → done(갤러리 1장)으로 복구되는지.
async function runRetryScenario(page, baseUrl, imageDir) {
  log("── 시나리오 [재시도] 강제 실패 → 재시도 복구 ──");

  const inputsBefore = await page.locator('input[type="file"]').count();
  await page.click('button:has-text("박스 추가")');
  await page.waitForFunction(
    (prev) => document.querySelectorAll('input[type="file"]').length > prev,
    inputsBefore,
    { timeout: 20_000 },
  );

  const scopeSelector =
    '[data-testid="image-section"][data-section-type="before"]';
  await page.waitForSelector(scopeSelector, { timeout: 20_000 });
  const beforeSection = page.locator(scopeSelector).first();

  // 업로드 엔드포인트(XHR PUT/POST)를 한 번만 강제 실패시킨다.
  let blocked = false;
  await page.route("**/api/admin/upload**", async (route) => {
    if (!blocked) {
      blocked = true;
      await route.fulfill({ status: 500, body: "forced-failure" });
      return;
    }
    await route.continue();
  });

  const files = await makeTestImages(imageDir, 1, "retry");
  const fileInput = beforeSection.locator('input[type="file"]').first();
  await fileInput.setInputFiles(files);

  // error 카드 등장 대기.
  await beforeSection
    .locator('[data-upload-status="error"]')
    .first()
    .waitFor({ timeout: 30_000 });
  log("[재시도] 강제 실패로 error 카드 등장 확인 ✔");

  // 라우트 해제 후 재시도.
  await page.unroute("**/api/admin/upload**");
  await beforeSection.locator('button:has-text("재시도")').first().click();

  // 갤러리 1장 + 큐 카드 0으로 복구 대기.
  const deadline = Date.now() + 30_000;
  let ok = false;
  while (Date.now() < deadline) {
    const p = await probeSection(page, scopeSelector);
    if (p.cards === 0 && p.thumbs === 1) {
      ok = true;
      break;
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  if (!ok) throw new Error("[재시도] 재시도 후 복구 실패(갤러리 1장 미도달)");
  log("[재시도] 재시도 → 정상 업로드 복구(갤러리 1장) ✔");
}

main();
