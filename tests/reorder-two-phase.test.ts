import { describe, expect, test } from "vitest";
import { createTestDb, seedCase } from "./helpers";

describe("case_images reorder 2-phase UPDATE pattern", () => {
  test("single-phase UPDATE violates UNIQUE(case_id, type, match_order)", () => {
    const db = createTestDb();
    const caseId = seedCase(db, {
      images: [
        { type: "before", match_order: 0 },
        { type: "before", match_order: 1 },
      ],
    });
    const rows = db
      .prepare(
        "SELECT id FROM case_images WHERE case_id=? ORDER BY match_order",
      )
      .all(caseId) as { id: number }[];
    const [firstId, secondId] = rows.map((r) => r.id);

    const swapSinglePhase = () => {
      const stmt = db.prepare(
        "UPDATE case_images SET match_order=? WHERE id=?",
      );
      db.transaction(() => {
        stmt.run(1, firstId);
        stmt.run(0, secondId);
      })();
    };

    expect(swapSinglePhase).toThrow(/UNIQUE constraint failed/);
  });

  test("two-phase UPDATE (negate to temp, then assign) succeeds", () => {
    const db = createTestDb();
    const caseId = seedCase(db, {
      images: [
        { type: "before", match_order: 0 },
        { type: "before", match_order: 1 },
        { type: "before", match_order: 2 },
      ],
    });
    const before = db
      .prepare(
        "SELECT id FROM case_images WHERE case_id=? ORDER BY match_order",
      )
      .all(caseId) as { id: number }[];
    const ids = before.map((r) => r.id);

    const reversed = [
      { id: ids[0], match_order: 2 },
      { id: ids[1], match_order: 1 },
      { id: ids[2], match_order: 0 },
    ];

    const stmt = db.prepare("UPDATE case_images SET match_order=? WHERE id=?");
    db.transaction((rows: { id: number; match_order: number }[]) => {
      for (const r of rows) stmt.run(-r.id, r.id);
      for (const r of rows) stmt.run(r.match_order, r.id);
    })(reversed);

    const after = db
      .prepare(
        "SELECT id, match_order FROM case_images WHERE case_id=? ORDER BY match_order",
      )
      .all(caseId) as { id: number; match_order: number }[];
    expect(after).toEqual([
      { id: ids[2], match_order: 0 },
      { id: ids[1], match_order: 1 },
      { id: ids[0], match_order: 2 },
    ]);
  });
});
