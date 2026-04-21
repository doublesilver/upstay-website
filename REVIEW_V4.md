# UPSTAY 재검증 리포트 v4 — Phase 1~5 수정 후

**검증 일시**: 2026-04-22
**기준 커밋**: `4da43dc` (Phase 5 직후)
**방식**: OMC architect 에이전트 (opus) 재검증

---

## 종합 판정

**🟢 조건부 배포 GO** — 차단 요소 없음.

|                      | REVIEW_V3 (이전) | REVIEW_V4 (현재)                    |
| -------------------- | ---------------- | ----------------------------------- |
| 🔴 Critical          | 13               | **0 미해결 / 2 부분 / 1 의도 보류** |
| 🟡 Major (검증 샘플) | 30+              | 14/15 해결, 1 미해결 (Arch-M5)      |
| 🟢 Minor             | 30+              | 추후 정리                           |

---

## 1. Critical 13건 대조표

| #          | 항목                    | 상태    | 근거                                                                                                                                                         |
| ---------- | ----------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Arch-C1    | /api/uploads 스트리밍   | ✅      | `app/api/uploads/[...path]/route.ts:36-45` `createReadStream`+`Readable.toWeb`                                                                               |
| Arch-C2    | 쿼리 3중복              | ⚠️ 부분 | `lib/home-data.ts:20-74` `buildCases()` 공통화 + `/api/remodeling` 삭제. 단 `/api/remodeling/[id]/route.ts`가 별표 쿼리 재작성 중 → 실사용 확인 후 삭제 필요 |
| Arch-C3    | DROP TABLE 폭탄         | ✅      | `lib/db/index.ts:24-69` DROP/ALTER 0건                                                                                                                       |
| Arch-C4    | 스키마 2체계            | ✅      | CREATE IF NOT EXISTS만 유지, ALTER은 004~007 마이그레이션으로                                                                                                |
| Rel-C1     | /api/remodeling dead    | ✅      | 파일 삭제 완료                                                                                                                                               |
| Rel-C2     | /api/announcements dead | ✅      | 디렉토리 삭제                                                                                                                                                |
| Rel-C3     | match_order 서버 재계산 | ✅      | `images/route.ts:33-39` MAX+1                                                                                                                                |
| Rel-C4     | reorder try/catch       | ✅      | 양쪽 라우트 JSON 500 응답                                                                                                                                    |
| Sec-Cand   | DELETE path 가드        | ✅      | `remodeling/route.ts:85-102` + `images/route.ts:140-160` path.resolve                                                                                        |
| Perf-C1    | icon-phone.png          | ✅      | **33KB** (3.5MB → 106배 감소)                                                                                                                                |
| Quality-C1 | 카테고리4 style 분리    | ✅      | 005 마이그레이션 + admin/config UI                                                                                                                           |
| Quality-C2 | show_on_main UNIQUE     | ✅      | 006 마이그레이션 + 사전 정리 UPDATE                                                                                                                          |
| Arch-C13   | admin 서버 가드         | ⏸ 보류  | sessionStorage 유지. 의도적, 다음 스프린트                                                                                                                   |

**해결 10 / 부분 2 / 보류 1 / 미해결 0**

---

## 2. Major 샘플 검증

✅ 해결: Sec-M1(rate limit), Sec-M2(JWT 8h+jti), Sec-M3(PUBLIC_KEYS), Sec-M4(CSP/XFO/nosniff), Sec-M5(is_starred 트랜잭션), UX-M1~M5(모달 backdrop/ESC/loading), Perf-M1(sizes), Perf-M2(cropperjs 제거), Rel-M4(Promise.allSettled), Arch-M3(dead editor), Arch-M7(reorder case_id 검증), Arch-M9(상세 SSR)

❌ 미해결: **Arch-M5 HeaderWrapper SSR** — `components/header-wrapper.tsx:7-12`에 CSR fetch 잔존. CLS/FOUC 지속.

---

## 3. Regression 리스크 (주의)

1. **Arch-C2 부분 잔존**: `/api/remodeling/[id]/route.ts:24-47`와 `app/remodeling/[id]/page.tsx:24-36`가 동일 쿼리 재작성 → 별표 필터 변경 시 2곳 동시 수정 필요
2. **UPLOAD_DIR 빈 filename 엣지**: `url === "/api/uploads/"`면 `resolve(UPLOAD_DIR, "")`가 UPLOAD_DIR 자체가 되어 unlink 시도. EISDIR로 실패하지만 가드 좁히는 편이 안전
3. **middleware 메모리 카운터**: 단일 인스턴스 전제 (현 규모 OK, 스케일아웃 시 Redis 기반 필요)
4. **마이그레이션 006 데이터**: `UPDATE SET show_on_main=0`이 중복 슬롯 자동 제거. 배포 전 DB 백업 필수
5. **admin sessionStorage**: XSS 1회 통과 시 토큰 유출 (C13 보류 결과)

---

## 4. 배포 판정

**🟢 조건부 GO**

**배포 전 필수 조건**:

1. `npm run backup` 으로 프로덕션 DB 백업 (006 마이그레이션 비멱등 UPDATE 때문)
2. Railway Variables에 `JWT_SECRET`(32자+), `ADMIN_ID`, `ADMIN_PW` 설정 확인 (`lib/auth.ts`가 fail-fast)
3. 1~2주 내 Arch-C13 스프린트 배정 계획

---

## 5. 다음 스프린트 우선순위 Top 5

| 순위 | 작업                                              | 영향                                                       |
| ---- | ------------------------------------------------- | ---------------------------------------------------------- |
| 1    | **Arch-C13** HttpOnly 쿠키 + `/admin` middleware  | XSS 토큰 탈취 방어                                         |
| 2    | **Arch-M5** HeaderWrapper SSR 전환                | CLS/FOUC 제거 + admin fetch 낭비 제거                      |
| 3    | **/api/remodeling/[id]** 실사용 확인 후 삭제/통합 | Arch-C2 중복 회귀 해소                                     |
| 4    | **Arch-M1** config-schema.ts 단일 소스            | ALLOWED_KEYS / Config / insertDefaultConfig 3곳 drift 제거 |
| 5    | **마이그레이션 멱등성 테스트**                    | 006/007 재실행 안전성                                      |

---

## 세션 총 커밋 요약

| 커밋      | 내용                                  |
| --------- | ------------------------------------- |
| `2e4b082` | Phase 1 — Critical 12건               |
| `3266c8c` | Phase 2 — 보안 헤더·JWT·SSR·Dead code |
| `733e3ab` | Phase 3 — UX Major                    |
| `799e29d` | Phase 4 — 신뢰성·공통화               |
| `4da43dc` | Phase 5 — 테스트 P0/P1 16건 추가      |

**변경 파일 합계**: ~60 / 신규 파일 10+ / 삭제 5 / 테스트 9 → 25
