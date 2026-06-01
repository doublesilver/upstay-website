#!/usr/bin/env bash
# UPSTAY production E2E 검사 — 운영 차단 회귀 자동 발견용.
#
# 검사 시나리오:
# 1. Public 페이지 응답
# 2. 메타 파일 (robots, sitemap, manifest, og)
# 3. 보안 헤더 (CSP, HSTS, X-Frame, X-Content, Referrer)
# 4. HTML 메타 (title, og, naver verification)
# 5. /admin/* 인증 보호 (인증 없으면 redirect)
# 6. /api/admin/* 인증 보호 (401)
# 7. 입력 검증 가드 (path traversal, null byte, 확장자)
# 8. 이미지 origin 직접 서빙 (/api/uploads/*) 응답 + 캐시 헤더
# 9. 로그인 rate limit (5회 후 429)
# 10. (선택) admin credentials로 mutation API 호출
#
# 실행:
#   bash scripts/e2e-check.sh                 # public만 (admin credentials 불필요)
#   ADMIN_ID=xxx ADMIN_PW=yyy bash scripts/e2e-check.sh  # mutation 포함

set -uo pipefail

BASE="${BASE_URL:-https://upstay.co.kr}"
PASS=0
FAIL=0
WARNINGS=0

ok() { printf "  ✅ %s\n" "$1"; PASS=$((PASS + 1)); }
fail() { printf "  ❌ %s\n" "$1"; FAIL=$((FAIL + 1)); }
warn() { printf "  ⚠️  %s\n" "$1"; WARNINGS=$((WARNINGS + 1)); }
section() { printf "\n## %s\n" "$1"; }

curl_code() {
  # -L 제거 — redirect follow하면 /admin/remodeling 307 → /admin 200으로 잘못 catch.
  # 인증 보호 검증은 첫 응답(307) 확인이 정답.
  curl -s -o /dev/null -w "%{http_code}" "$1" -H 'User-Agent: e2e-check'
}

curl_header() {
  curl -sI "$1" -H 'User-Agent: e2e-check'
}

assert_code() {
  local url="$1" expected="$2" desc="$3"
  local code
  code=$(curl_code "$url")
  if [ "$code" = "$expected" ]; then ok "$desc ($code)"; else fail "$desc — expected $expected, got $code"; fi
}

echo "=========================================="
echo " UPSTAY E2E 검사 시작 — $(date +%H:%M:%S)"
echo " BASE=$BASE"
echo "=========================================="

# public 페이지는 직접 200이거나 Cloudflare가 캐시 응답.
curl_code_follow() {
  curl -sL -o /dev/null -w "%{http_code}" "$1" -H 'User-Agent: e2e-check'
}
assert_follow() {
  local url="$1" expected="$2" desc="$3"
  local code
  code=$(curl_code_follow "$url")
  if [ "$code" = "$expected" ]; then ok "$desc ($code)"; else fail "$desc — expected $expected, got $code"; fi
}

section "1. Public 페이지"
assert_follow "$BASE/"                    200 "GET /"
assert_follow "$BASE/remodeling"          200 "GET /remodeling"
# 사례 상세는 sitemap에서 실 case ID 추출 (DB 첫 사례)
sample_case=$(curl -sL "$BASE/sitemap.xml" | grep -oE '/remodeling/[0-9]+' | head -1)
if [ -n "$sample_case" ]; then
  assert_follow "$BASE$sample_case"       200 "GET $sample_case"
else
  warn "sitemap에서 사례 ID 못 찾음"
fi
assert_follow "$BASE/rental-management"   200 "GET /rental-management"
assert_follow "$BASE/building-management" 200 "GET /building-management"

section "2. 메타 파일"
assert_code "$BASE/robots.txt"           200 "robots.txt"
assert_code "$BASE/sitemap.xml"          200 "sitemap.xml"
assert_code "$BASE/manifest.webmanifest" 200 "manifest"
assert_code "$BASE/og-image-v2.png"      200 "og-image-v2"
assert_code "$BASE/icon.svg"             200 "icon.svg"
assert_code "$BASE/apple-icon.png"       200 "apple-icon"

section "3. 보안 헤더 (HTML 응답)"
headers=$(curl_header "$BASE/")
for h in "content-security-policy" "strict-transport-security" "x-frame-options" "x-content-type-options" "referrer-policy"; do
  if echo "$headers" | grep -iq "^$h:"; then ok "$h"; else fail "$h 누락"; fi
done

# 이미지는 origin 직접 서빙(/api/uploads/*)이라 img-src 'self'면 충분.
if echo "$headers" | grep -i "content-security-policy" | grep -iq "img-src[^;]*'self'"; then
  ok "CSP img-src에 'self' 포함 (origin 직접 서빙)"
else
  fail "CSP img-src에 'self' 미포함 — origin 이미지 차단됨"
fi

section "4. HTML 메타"
html=$(curl -sL "$BASE/" -H 'User-Agent: e2e-check')
if echo "$html" | grep -q '<title>업스테이'; then ok "<title> 정상"; else fail "<title> 누락"; fi
if echo "$html" | grep -q 'naver-site-verification'; then ok "naver-site-verification"; else fail "naver-site-verification 누락"; fi
if echo "$html" | grep -q 'og:title'; then ok "og:title"; else fail "og:title 누락"; fi

section "5. 인증 보호"
admin_code=$(curl_code "$BASE/admin/remodeling")
if [ "$admin_code" = "307" ] || [ "$admin_code" = "302" ]; then ok "/admin/remodeling redirect ($admin_code)"; else fail "/admin/remodeling — expected 307, got $admin_code"; fi

api_admin_code=$(curl_code "$BASE/api/admin/config")
if [ "$api_admin_code" = "401" ]; then ok "/api/admin/config 401"; else fail "/api/admin/config — expected 401, got $api_admin_code"; fi

assert_code "$BASE/api/config" 200 "/api/config (공개)"

section "6. 입력 검증 가드"
trav_code=$(curl_code "$BASE/api/uploads/..%2F..%2Fetc%2Fpasswd")
if [ "$trav_code" = "404" ]; then ok "path traversal 차단 ($trav_code)"; else fail "path traversal — expected 404, got $trav_code"; fi

null_code=$(curl_code "$BASE/api/uploads/test%00.jpg")
if [ "$null_code" = "400" ] || [ "$null_code" = "404" ]; then ok "null byte 차단 ($null_code)"; else fail "null byte — expected 400/404, got $null_code"; fi

ext_code=$(curl_code "$BASE/api/uploads/test.exe")
if [ "$ext_code" = "404" ]; then ok "확장자 차단 ($ext_code)"; else fail "확장자 차단 — expected 404, got $ext_code"; fi

section "7. 이미지 origin 직접 서빙 (/api/uploads/*)"
# 이미지는 R2/외부 CDN 없이 origin이 /api/uploads/* 로 직접 서빙. Cloudflare가 그 응답을 캐시.
# HTML에서 /api/uploads/*.webp 경로(상대) 추출 → 절대 URL로 검증.
sample_path=$(curl -sL "$BASE/remodeling" -H 'User-Agent: e2e-check' | grep -oE '/api/uploads/[^"]+\.webp' | head -1)
if [ -n "$sample_path" ]; then
  sample_img="$BASE$sample_path"
  img_code=$(curl_code "$sample_img")
  if [ "$img_code" = "200" ]; then ok "origin 이미지 200 ($sample_path)"; else fail "origin 이미지 $img_code ($sample_path)"; fi
  img_headers=$(curl_header "$sample_img")
  # 협상 제거(H-1) 회귀 감시: 응답에 Vary가 없어야 한다(CDN 캐시 분리·avif 강제 방지).
  if echo "$img_headers" | grep -iq "^vary:.*accept"; then
    fail "이미지 응답에 Vary:Accept 잔존 — 협상 제거(H-1) 회귀. avif 강제 위험"
  else
    ok "이미지 응답에 Vary:Accept 없음 (협상 제거 정상)"
  fi
  # content-type은 요청 확장자 그대로(webp). avif로 변환되면 안 됨.
  ct=$(echo "$img_headers" | grep -i "^content-type:" | tr -d '\r' | awk '{print $2}')
  if echo "$ct" | grep -iq "image/webp"; then ok "이미지 content-type: $ct (webp 단일 고정)"; else warn "이미지 content-type: $ct (webp 예상)"; fi
  if echo "$img_headers" | grep -iq "^cache-control:.*immutable"; then ok "이미지 Cache-Control immutable"; else warn "이미지 Cache-Control immutable 누락"; fi
  cf_cache=$(echo "$img_headers" | grep -i "cf-cache-status:" | tr -d '\r' | awk '{print $2}')
  [ -n "$cf_cache" ] && ok "cf-cache: $cf_cache" || warn "cf-cache 헤더 없음 (CF proxy 미경유?)"
else
  warn "샘플 이미지 URL 못 찾음 (/remodeling HTML에 /api/uploads 없음?)"
fi

section "8. 로그인 rate limit (5회 시도 후 429 검증)"
for i in 1 2 3 4 5; do
  curl -s -X POST -H 'Content-Type: application/json' --data-raw '{"id":"_e2e","password":"_e2e"}' -o /dev/null "$BASE/api/auth" || true
done
sixth=$(curl -s -X POST -H 'Content-Type: application/json' --data-raw '{"id":"_e2e","password":"_e2e"}' -o /dev/null -w "%{http_code}" "$BASE/api/auth")
if [ "$sixth" = "429" ]; then ok "6번째 시도 429 (rate limit 정상)"; else fail "rate limit 미동작 — 6번째 코드 $sixth"; fi

section "9. (선택) 인증 후 mutation API"
if [ -n "${ADMIN_ID:-}" ] && [ -n "${ADMIN_PW:-}" ]; then
  cookie_file=$(mktemp)
  login=$(curl -s -X POST -H 'Content-Type: application/json' --data-raw "{\"id\":\"$ADMIN_ID\",\"password\":\"$ADMIN_PW\"}" -c "$cookie_file" -o /dev/null -w "%{http_code}" "$BASE/api/auth")
  if [ "$login" = "200" ]; then
    ok "admin 로그인 200"
    # 인증된 admin config GET
    cfg_code=$(curl -s -b "$cookie_file" -o /dev/null -w "%{http_code}" "$BASE/api/admin/config")
    if [ "$cfg_code" = "200" ]; then ok "/api/admin/config GET 200"; else fail "/api/admin/config GET $cfg_code"; fi
    # mutation은 데이터 변경이라 검증만 (실제 PUT 안 함)
    # 사용자가 직접 admin UI에서 저장 확인 권장
  else
    warn "admin 로그인 실패 (코드 $login). rate limit 또는 credentials 오류."
  fi
  rm -f "$cookie_file"
else
  warn "ADMIN_ID/PW 미제공 — mutation 검증 skip. ADMIN_ID=xxx ADMIN_PW=yyy bash scripts/e2e-check.sh"
fi

echo ""
echo "=========================================="
echo " 결과: ✅ $PASS / ❌ $FAIL / ⚠️ $WARNINGS"
echo "=========================================="
[ "$FAIL" -gt 0 ] && exit 1 || exit 0
