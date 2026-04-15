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
  {
    id: "03",
    before: unsplash("photo-1502672260266-1c1ef2d93688"),
    after: unsplash("photo-1600585154340-be6161a56a0c"),
  },
  {
    id: "04",
    before: unsplash("photo-1533779283484-8ad4940aa3a8"),
    after: unsplash("photo-1600566753190-17f0baa2a6c3"),
  },
];

export const remodelingServiceItems = [
  { title: "주방", description: "싱크대·타일·후드 교체" },
  { title: "욕실", description: "방수·타일·위생기구 교체" },
  { title: "베란다", description: "확장·샷시·방수 공사" },
  { title: "현관", description: "중문·신발장·타일 시공" },
  { title: "천장", description: "몰딩·조명·텍스 교체" },
  { title: "도배", description: "벽지·페인트·곰팡이 처리" },
  { title: "바닥", description: "장판·마루·타일 시공" },
  { title: "기타", description: "구멍보수·샷시·몰딩 등" },
];

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
