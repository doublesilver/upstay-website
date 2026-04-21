import { describe, expect, test } from "vitest";
import { createTestDb, seedCase } from "./helpers";

describe("getMainCases filter semantics (star + image presence)", () => {
  test("excludes cases whose starred images are all missing url", () => {
    const db = createTestDb();
    seedCase(db, {
      showOnMain: 1,
      images: [
        {
          type: "before",
          match_order: 0,
          is_starred: 1,
          image_url: "",
        },
      ],
    });

    const rows = db
      .prepare(
        `SELECT c.id FROM remodeling_cases c
         WHERE c.show_on_main IN (1,2,3)
         AND EXISTS (
           SELECT 1 FROM case_images i
           WHERE i.case_id=c.id AND i.is_starred=1 AND i.image_url<>''
         )`,
      )
      .all() as { id: number }[];
    expect(rows.length).toBe(0);
  });

  test("excludes cases without any starred image", () => {
    const db = createTestDb();
    seedCase(db, {
      showOnMain: 1,
      images: [
        { type: "before", match_order: 0, is_starred: 0 },
        { type: "after", match_order: 0, is_starred: 0 },
      ],
    });

    const rows = db
      .prepare(
        `SELECT c.id FROM remodeling_cases c
         WHERE c.show_on_main IN (1,2,3)
         AND EXISTS (
           SELECT 1 FROM case_images i
           WHERE i.case_id=c.id AND i.is_starred=1 AND i.image_url<>''
         )`,
      )
      .all() as { id: number }[];
    expect(rows.length).toBe(0);
  });

  test("includes cases with at least one starred+url image", () => {
    const db = createTestDb();
    const caseId = seedCase(db, {
      showOnMain: 1,
      images: [
        { type: "before", match_order: 0, is_starred: 1 },
        { type: "after", match_order: 0, is_starred: 0 },
      ],
    });

    const rows = db
      .prepare(
        `SELECT c.id FROM remodeling_cases c
         WHERE c.show_on_main IN (1,2,3)
         AND EXISTS (
           SELECT 1 FROM case_images i
           WHERE i.case_id=c.id AND i.is_starred=1 AND i.image_url<>''
         )`,
      )
      .all() as { id: number }[];
    expect(rows.map((r) => r.id)).toEqual([caseId]);
  });

  test("excludes show_on_main=0 cases", () => {
    const db = createTestDb();
    seedCase(db, {
      showOnMain: 0,
      images: [{ type: "before", match_order: 0, is_starred: 1 }],
    });

    const rows = db
      .prepare(
        `SELECT c.id FROM remodeling_cases c
         WHERE c.show_on_main IN (1,2,3)
         AND EXISTS (
           SELECT 1 FROM case_images i
           WHERE i.case_id=c.id AND i.is_starred=1 AND i.image_url<>''
         )`,
      )
      .all() as { id: number }[];
    expect(rows.length).toBe(0);
  });
});
