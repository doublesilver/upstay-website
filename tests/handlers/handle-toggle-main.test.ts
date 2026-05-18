import { describe, expect, test } from "vitest";
import {
  getMainSlotConflicts,
  type CaseLike,
} from "../../lib/case-sorting";

function mkCase(id: number, show_on_main: number): CaseLike {
  return { id, sort_order: 0, show_on_main, is_draft: 0 };
}

describe("getMainSlotConflicts — handleToggleMain의 충돌 처리", () => {
  test("value=0 (슬롯 해제) → 빈 배열", () => {
    const cases = [mkCase(1, 1), mkCase(2, 2), mkCase(3, 3)];
    expect(getMainSlotConflicts(cases, 99, 0)).toEqual([]);
  });

  test("value가 1-3이고 같은 슬롯 박스가 있으면 그 박스 반환", () => {
    const cases = [mkCase(1, 1), mkCase(2, 2), mkCase(3, 3)];
    // value=1 슬롯에 박스 id=1이 있다. 다른 박스(id=99)가 이 슬롯을 요구.
    const conflicts = getMainSlotConflicts(cases, 99, 1);
    expect(conflicts.map((c) => c.id)).toEqual([1]);
  });

  test("자기 자신은 충돌에서 제외", () => {
    // 같은 박스가 같은 슬롯을 다시 클릭한 경우는 충돌 아님.
    const cases = [mkCase(5, 2), mkCase(6, 1)];
    expect(getMainSlotConflicts(cases, 5, 2)).toEqual([]);
  });

  test("같은 슬롯 박스가 없으면 빈 배열", () => {
    // 슬롯 1을 점유하는 박스가 없는 상태에서 슬롯 1을 요청 → 충돌 없음.
    const cases = [mkCase(1, 2), mkCase(2, 3)];
    expect(getMainSlotConflicts(cases, 99, 1)).toEqual([]);
  });

  test("value가 범위(1-3) 밖이면 빈 배열", () => {
    const cases = [mkCase(1, 1), mkCase(2, 2)];
    expect(getMainSlotConflicts(cases, 99, 4)).toEqual([]);
    expect(getMainSlotConflicts(cases, 99, -1)).toEqual([]);
    expect(getMainSlotConflicts(cases, 99, 99)).toEqual([]);
  });

  test("다른 슬롯의 박스는 충돌이 아니다 (선택성)", () => {
    // 슬롯 2를 요청했는데 슬롯 1, 3 점유 박스는 그대로 둬야 한다.
    const cases = [
      mkCase(1, 1), // 슬롯 1 — 영향 없음
      mkCase(2, 2), // 슬롯 2 — 충돌
      mkCase(3, 3), // 슬롯 3 — 영향 없음
    ];
    const conflicts = getMainSlotConflicts(cases, 99, 2);
    expect(conflicts.map((c) => c.id)).toEqual([2]);
  });

  test("show_on_main=0인 박스는 어떤 슬롯 요청에도 충돌 아님", () => {
    // 그 외 영역(0)에 있는 박스는 슬롯 점유 중이 아니므로 충돌하지 않는다.
    const cases = [mkCase(1, 0), mkCase(2, 0), mkCase(3, 2)];
    const conflicts = getMainSlotConflicts(cases, 99, 1);
    expect(conflicts).toEqual([]);
  });

  test("선택 박스가 이미 같은 슬롯을 점유했더라도 자기 자신은 제외", () => {
    // self가 슬롯 1을 점유 중이고, 다시 슬롯 1을 클릭 → 자기 자신 제외 → 빈 배열.
    // (UI에서는 토글로 0이 전송되겠지만 함수 단독 호출 시도 안전해야 함)
    const cases = [mkCase(7, 1)];
    expect(getMainSlotConflicts(cases, 7, 1)).toEqual([]);
  });
});
