import { describe, expect, test } from "vitest";
import { nextTopSortOrder, type CaseLike } from "../../lib/case-sorting";

function mkCase(id: number, sort_order: number): CaseLike {
  return { id, sort_order, show_on_main: 0, is_draft: 0 };
}

describe("nextTopSortOrder — handleAdd sort_order 계산", () => {
  test("빈 배열 → 0", () => {
    expect(nextTopSortOrder([])).toBe(0);
  });

  test("단일 박스 → 그 값 -1", () => {
    expect(nextTopSortOrder([mkCase(1, 5)])).toBe(4);
    expect(nextTopSortOrder([mkCase(1, 0)])).toBe(-1);
    expect(nextTopSortOrder([mkCase(1, -3)])).toBe(-4);
  });

  test("모든 sort_order 양수 → 최소값-1", () => {
    const cases = [mkCase(1, 3), mkCase(2, 7), mkCase(3, 5)];
    expect(nextTopSortOrder(cases)).toBe(2);
  });

  test("음수 sort_order가 섞여 있으면 더 작은 음수 반환", () => {
    const cases = [mkCase(1, 5), mkCase(2, -2), mkCase(3, 0)];
    expect(nextTopSortOrder(cases)).toBe(-3);
  });

  test("모두 동일한 sort_order → 그 값-1", () => {
    const cases = [mkCase(1, 10), mkCase(2, 10), mkCase(3, 10)];
    expect(nextTopSortOrder(cases)).toBe(9);
  });

  test("이미 -5인 박스가 있으면 -6 반환 (연속 추가 시 단조 감소)", () => {
    // 새박스를 두 번 연속 추가하는 시나리오. 두 번째 추가는 첫 번째보다 더 위.
    const after1st = [
      mkCase(1, 0),
      mkCase(2, 1),
      mkCase(3, -1), // 1차 추가 박스
    ];
    expect(nextTopSortOrder(after1st)).toBe(-2);

    const after2nd = [
      ...after1st,
      mkCase(4, -2), // 2차 추가
    ];
    expect(nextTopSortOrder(after2nd)).toBe(-3);
  });

  test("show_on_main이나 is_draft 상태와 무관하게 sort_order만 본다", () => {
    // 도메인 규칙: 모든 박스의 sort_order 최소값을 본다. 메인 박스도 포함.
    // (메인 박스는 정렬상 sort_order를 무시하지만 컬럼 값 자체는 남아 있어
    //  새 박스가 그것보다 위로 올라가야 메인을 제외한 그 외 영역에서 최상단을 차지)
    const cases: CaseLike[] = [
      { id: 1, sort_order: 100, show_on_main: 1, is_draft: 0 },
      { id: 2, sort_order: 5, show_on_main: 0, is_draft: 0 },
      { id: 3, sort_order: -1, show_on_main: 0, is_draft: 1 },
    ];
    expect(nextTopSortOrder(cases)).toBe(-2);
  });
});
