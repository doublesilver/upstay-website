import { describe, expect, test } from "vitest";
import { createTestDb, seedCase } from "./helpers";

// 검수 L-10: 이 회귀 테스트는 운영 공개 필터(lib/home-data.ts getMainCases/buildCases)와
// 동일한 의미여야 한다. 운영은 별표 여부를 is_starred 가 아니라 slot_position>0 으로 판정하고,
// is_draft=1(새박스)은 공개에서 제외한다. 이전 버전은 is_starred=1 을 검증해 실제 필터와
// 어긋났다 — 여기서 slot_position>0 기준으로 정렬한다.
const PUBLIC_FILTER = `
  c.show_on_main IN (1,2,3)
  AND c.is_draft = 0
  AND EXISTS (
    SELECT 1 FROM case_images i
    WHERE i.case_id=c.id AND i.slot_position > 0 AND i.image_url <> ''
  )`;

function selectPublicCaseIds(db: ReturnType<typeof createTestDb>): number[] {
  return (
    db
      .prepare(`SELECT c.id FROM remodeling_cases c WHERE ${PUBLIC_FILTER}`)
      .all() as { id: number }[]
  ).map((r) => r.id);
}

describe("getMainCases filter semantics (slot_position + image presence + draft)", () => {
  test("excludes cases whose slotted images all have empty url", () => {
    const db = createTestDb();
    seedCase(db, {
      showOnMain: 1,
      images: [
        {
          type: "before",
          match_order: 0,
          slot_position: 1,
          image_url: "",
        },
      ],
    });
    expect(selectPublicCaseIds(db)).toEqual([]);
  });

  test("excludes cases without any slotted image (slot_position=0)", () => {
    const db = createTestDb();
    seedCase(db, {
      showOnMain: 1,
      images: [
        { type: "before", match_order: 0, slot_position: 0 },
        { type: "after", match_order: 0, slot_position: 0 },
      ],
    });
    expect(selectPublicCaseIds(db)).toEqual([]);
  });

  test("includes cases with at least one slotted+url image", () => {
    const db = createTestDb();
    const caseId = seedCase(db, {
      showOnMain: 1,
      images: [
        { type: "before", match_order: 0, slot_position: 1 },
        { type: "after", match_order: 0, slot_position: 0 },
      ],
    });
    expect(selectPublicCaseIds(db)).toEqual([caseId]);
  });

  test("excludes show_on_main=0 cases", () => {
    const db = createTestDb();
    seedCase(db, {
      showOnMain: 0,
      images: [{ type: "before", match_order: 0, slot_position: 1 }],
    });
    expect(selectPublicCaseIds(db)).toEqual([]);
  });

  test("excludes is_draft=1 (new box) cases even if slotted", () => {
    const db = createTestDb();
    seedCase(db, {
      showOnMain: 1,
      isDraft: 1,
      images: [{ type: "before", match_order: 0, slot_position: 1 }],
    });
    expect(selectPublicCaseIds(db)).toEqual([]);
  });
});
