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
