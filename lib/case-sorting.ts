// 리모델링 박스 정렬·조작에 쓰이는 순수 함수 모음.
// React 컴포넌트 안에 인라인으로 있던 로직을 분리해 단위 테스트 가능하게 함.
//
// 도메인 규칙(요약):
//   - 박스는 3단계 영역으로 나뉜다: 새박스(draft) → 메인1/2/3 → 그 외.
//   - "박스 추가" 직후엔 is_draft=1 상태로 최상단에 추가됨.
//   - "저장" 또는 "메인1/2/3" 클릭 시 is_draft=0으로 전이 → 해당 영역으로 이동.
//   - 메인 슬롯(1/2/3)은 DB의 partial UNIQUE index(show_on_main>0)로 단일 점유 보장.

export interface CaseLike {
  id: number;
  sort_order: number;
  show_on_main: number;
  is_draft: number;
}

/**
 * 박스 목록을 화면 표시 순서로 정렬한다.
 *
 *   1) drafts(is_draft=1)   — 최상단. sort_order 오름차순.
 *   2) mainSlots(1/2/3)     — 그 다음. 슬롯 번호 1→2→3 순.
 *   3) others                — 하단. sort_order 오름차순.
 *
 * 같은 영역 내에서 sort_order가 동률이면 id 오름차순으로 안정화한다.
 * (id 안정화가 없으면 React key 흔들림으로 dnd-kit 드래그가 깨질 수 있음)
 */
export function sortCases<T extends CaseLike>(cases: T[]): T[] {
  const drafts: T[] = [];
  const mainSlots: (T | undefined)[] = [undefined, undefined, undefined];
  const others: T[] = [];

  for (const c of cases) {
    if (c.is_draft === 1) {
      drafts.push(c);
    } else if (c.show_on_main >= 1 && c.show_on_main <= 3) {
      mainSlots[c.show_on_main - 1] = c;
    } else {
      others.push(c);
    }
  }

  const main = mainSlots.filter((c): c is T => c !== undefined);
  const sortByOrder = (a: T, b: T) =>
    a.sort_order - b.sort_order || a.id - b.id;
  drafts.sort(sortByOrder);
  others.sort(sortByOrder);
  return [...drafts, ...main, ...others];
}

/**
 * "박스 추가" 시 새 박스에 부여할 sort_order를 계산한다.
 *
 * 전략: 현재 모든 박스 중 최소 sort_order보다 1 작은 값.
 * 그래야 새 박스가
 *   ① 새박스 영역 안에서 가장 위 (최근 추가가 위)
 *   ② "저장" 후 그 외 영역으로 이동해도 그 외 영역의 가장 위(메인 바로 아래)
 * 두 위치 모두 만족한다. 메인 영역은 sort_order를 무시하므로 영향 없음.
 *
 * 빈 배열이면 0을 반환 (초기 상태에서 첫 박스).
 */
export function nextTopSortOrder<T extends CaseLike>(cases: T[]): number {
  if (cases.length === 0) return 0;
  return Math.min(...cases.map((c) => c.sort_order)) - 1;
}

/**
 * 메인 슬롯(1/2/3) 지정 시, 이미 그 슬롯을 점유 중이라 비워야 할 박스들을 반환.
 *
 *   - value가 0(슬롯 해제)이면 빈 배열.
 *   - value가 1~3이면 같은 show_on_main을 가진 다른 박스들(자기 자신 제외).
 *
 * DB의 partial UNIQUE index(idx_show_on_main_slot: show_on_main>0) 때문에
 * 새 슬롯 부여 전 충돌 박스를 먼저 0으로 비워야 한다. 동시 전송 시 UNIQUE 위반.
 */
export function getMainSlotConflicts<T extends CaseLike>(
  cases: T[],
  selfId: number,
  value: number,
): T[] {
  if (value < 1 || value > 3) return [];
  return cases.filter((c) => c.show_on_main === value && c.id !== selfId);
}
