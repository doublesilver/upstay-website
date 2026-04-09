// 임시 이미지 — 실제 프로젝트 사진으로 교체 예정
const unsplash = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&h=900&q=80`;

export const remodelingCases = [
  {
    id: "01",
    before: unsplash("photo-1560448204-e02f11c3d0e2"),
    after: unsplash("photo-1600607687939-ce8a6c25118c"),
  },
  {
    id: "02",
    before: unsplash("photo-1484101403633-562f891dc89a"),
    after: unsplash("photo-1586023492125-27b2c045efd7"),
  },
];

// 임시 설명 — 실제 서비스 소개 문구로 교체 예정
export const buildingManagementItems = [
  {
    title: "설비",
    description: "냉난방, 급배수, 환기 등 기본 설비 점검 및 유지보수",
  },
  {
    title: "전기",
    description: "차단기, 조명, 콘센트 등 전기 설비 유지보수",
  },
  {
    title: "목공",
    description: "마감재, 문틀, 내장 마감 보수 작업",
  },
  {
    title: "소방",
    description: "소화기, 스프링클러, 비상구 등 소방 설비 점검",
  },
  {
    title: "청소",
    description: "공용부 및 외부 공간의 정기 청소 관리",
  },
];

export const rentalManagementItems = [
  {
    title: "공실관리",
    description: "공실 상태 점검과 다음 임차 준비",
  },
  {
    title: "입퇴실 시 입주자 및 시설물 관리",
    description: "입주·퇴실 시 시설물 상태 확인 및 인계 절차",
  },
  {
    title: "월세·관리비·공과금 정산 및 수납 독촉",
    description: "정기 수납 관리와 미납 건 대응",
  },
  {
    title: "민원 접수 및 처리",
    description: "임차인 요청·불편 사항 접수 및 해결",
  },
  {
    title: "악성 연체자 소송 집행 · 재판 · 강제 퇴실",
    description: "법적 절차 지원 및 강제집행",
  },
];
