import { describe, expect, test } from "vitest";
import { createTestDb, seedCase } from "./helpers";

const MAX_STARRED = 4;

function countStarred(
  db: ReturnType<typeof createTestDb>,
  caseId: number,
  type: "before" | "after",
): number {
  const row = db
    .prepare(
      "SELECT COUNT(*) AS n FROM case_images WHERE case_id=? AND type=? AND is_starred=1",
    )
    .get(caseId, type) as { n: number };
  return row.n;
}

describe("BEFORE/AFTER star 4-count server guard", () => {
  test("allows the 4th star", () => {
    const db = createTestDb();
    const caseId = seedCase(db, {
      images: [
        { type: "before", match_order: 0, is_starred: 1 },
        { type: "before", match_order: 1, is_starred: 1 },
        { type: "before", match_order: 2, is_starred: 1 },
        { type: "before", match_order: 3, is_starred: 0 },
      ],
    });
    const fourth = db
      .prepare(
        "SELECT id FROM case_images WHERE case_id=? AND type='before' AND is_starred=0",
      )
      .get(caseId) as { id: number };
    expect(countStarred(db, caseId, "before")).toBeLessThan(MAX_STARRED);
    db.prepare("UPDATE case_images SET is_starred=1 WHERE id=?").run(fourth.id);
    expect(countStarred(db, caseId, "before")).toBe(4);
  });

  test("server guard rejects 5th star (count check)", () => {
    const db = createTestDb();
    const caseId = seedCase(db, {
      images: [
        { type: "before", match_order: 0, is_starred: 1 },
        { type: "before", match_order: 1, is_starred: 1 },
        { type: "before", match_order: 2, is_starred: 1 },
        { type: "before", match_order: 3, is_starred: 1 },
        { type: "before", match_order: 4, is_starred: 0 },
      ],
    });
    expect(countStarred(db, caseId, "before")).toBe(MAX_STARRED);
  });

  test("before and after are counted independently", () => {
    const db = createTestDb();
    const caseId = seedCase(db, {
      images: [
        { type: "before", match_order: 0, is_starred: 1 },
        { type: "before", match_order: 1, is_starred: 1 },
        { type: "before", match_order: 2, is_starred: 1 },
        { type: "before", match_order: 3, is_starred: 1 },
        { type: "after", match_order: 0, is_starred: 0 },
      ],
    });
    expect(countStarred(db, caseId, "before")).toBe(MAX_STARRED);
    expect(countStarred(db, caseId, "after")).toBe(0);
  });
});
