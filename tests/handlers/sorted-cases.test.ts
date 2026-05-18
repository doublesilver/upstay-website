import { describe, expect, test } from "vitest";
import { sortCases, type CaseLike } from "../../lib/case-sorting";

// 테스트용 미니 case 빌더. RemodelingCase의 정렬 관련 필드만 다룬다.
function mkCase(
  id: number,
  opts: Partial<Omit<CaseLike, "id">> = {},
): CaseLike {
  return {
    id,
    sort_order: opts.sort_order ?? 0,
    show_on_main: opts.show_on_main ?? 0,
    is_draft: opts.is_draft ?? 0,
  };
}

describe("sortCases — 3단계 영역 정렬", () => {
  test("drafts → mains(1→2→3) → others 순서로 묶인다", () => {
    const input = [
      mkCase(10, { is_draft: 0, show_on_main: 0, sort_order: 5 }),
      mkCase(20, { is_draft: 0, show_on_main: 2, sort_order: 99 }),
      mkCase(30, { is_draft: 1, show_on_main: 0, sort_order: 7 }),
      mkCase(40, { is_draft: 0, show_on_main: 1, sort_order: 100 }),
      mkCase(50, { is_draft: 0, show_on_main: 3, sort_order: 50 }),
      mkCase(60, { is_draft: 0, show_on_main: 0, sort_order: 1 }),
    ];

    const out = sortCases(input).map((c) => c.id);
    // drafts: [30], mains 1→2→3: [40, 20, 50], others: sort_order asc [60, 10]
    expect(out).toEqual([30, 40, 20, 50, 60, 10]);
  });

  test("drafts는 sort_order 오름차순으로 정렬된다", () => {
    const input = [
      mkCase(1, { is_draft: 1, sort_order: 3 }),
      mkCase(2, { is_draft: 1, sort_order: -2 }),
      mkCase(3, { is_draft: 1, sort_order: 0 }),
    ];
    const out = sortCases(input).map((c) => c.id);
    expect(out).toEqual([2, 3, 1]);
  });

  test("others는 sort_order 오름차순(음수 포함)으로 정렬된다", () => {
    const input = [
      mkCase(1, { sort_order: 5 }),
      mkCase(2, { sort_order: -10 }),
      mkCase(3, { sort_order: 0 }),
      mkCase(4, { sort_order: -3 }),
    ];
    const out = sortCases(input).map((c) => c.id);
    expect(out).toEqual([2, 4, 3, 1]);
  });

  test("같은 sort_order면 id 오름차순으로 안정 정렬된다", () => {
    const input = [
      mkCase(30, { sort_order: 1 }),
      mkCase(10, { sort_order: 1 }),
      mkCase(20, { sort_order: 1 }),
    ];
    const out = sortCases(input).map((c) => c.id);
    expect(out).toEqual([10, 20, 30]);
  });

  test("drafts가 없는 경우 → mains + others만", () => {
    const input = [
      mkCase(1, { show_on_main: 2 }),
      mkCase(2, { show_on_main: 1 }),
      mkCase(3, { sort_order: 10 }),
    ];
    const out = sortCases(input).map((c) => c.id);
    expect(out).toEqual([2, 1, 3]);
  });

  test("mains 슬롯이 일부만 차 있는 경우 빈 슬롯은 건너뛴다", () => {
    // 슬롯 1만 점유: [main1] → [others...]
    const onlyOne = [
      mkCase(7, { show_on_main: 1 }),
      mkCase(8, { sort_order: 0 }),
    ];
    expect(sortCases(onlyOne).map((c) => c.id)).toEqual([7, 8]);

    // 슬롯 1, 3 점유, 2는 비어있음 → 순서는 1→3
    const oneAndThree = [
      mkCase(11, { show_on_main: 3 }),
      mkCase(12, { show_on_main: 1 }),
      mkCase(13, { sort_order: 0 }),
    ];
    expect(sortCases(oneAndThree).map((c) => c.id)).toEqual([12, 11, 13]);

    // 슬롯 2만 점유 → 그것 하나
    const onlyTwo = [mkCase(99, { show_on_main: 2 })];
    expect(sortCases(onlyTwo).map((c) => c.id)).toEqual([99]);
  });

  test("others 영역에 박스가 없는 경우 → drafts + mains만", () => {
    const input = [
      mkCase(1, { is_draft: 1 }),
      mkCase(2, { show_on_main: 1 }),
      mkCase(3, { show_on_main: 3 }),
    ];
    const out = sortCases(input).map((c) => c.id);
    expect(out).toEqual([1, 2, 3]);
  });

  test("mains 영역에 박스가 없는 경우 → drafts + others만", () => {
    const input = [
      mkCase(1, { is_draft: 1, sort_order: 0 }),
      mkCase(2, { sort_order: 5 }),
      mkCase(3, { sort_order: 1 }),
    ];
    const out = sortCases(input).map((c) => c.id);
    expect(out).toEqual([1, 3, 2]);
  });

  test("빈 배열 → 빈 배열", () => {
    expect(sortCases([])).toEqual([]);
  });

  test("is_draft=1이면 show_on_main 값이 1-3이어도 drafts로 분류된다", () => {
    // is_draft가 우선순위 가장 높음. 데이터 정합성 깨진 케이스를 안전하게 처리.
    const input = [
      mkCase(1, { is_draft: 1, show_on_main: 2, sort_order: 0 }),
      mkCase(2, { is_draft: 0, show_on_main: 2 }),
    ];
    const out = sortCases(input).map((c) => c.id);
    // draft가 먼저, 그 다음 main slot 2.
    expect(out).toEqual([1, 2]);
  });
});
