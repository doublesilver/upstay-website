// NOTE: buildingManagementItems/rentalManagementItems는 상세 페이지 폴백. 홈 ServiceSections는 DB config 우선 사용.
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
    description: "상태 점검 및 다음 임차 준비",
  },
  {
    title: "입퇴실 관리",
    description: "시설물 확인 및 인계 절차",
  },
  {
    title: "수납 관리",
    description: "월세·관리비·공과금 정산 및 독촉",
  },
  {
    title: "민원 처리",
    description: "임차인 요청·불편 사항 해결",
  },
  {
    title: "연체 대응",
    description: "소송·재판·강제 퇴실 법적 절차",
  },
];
