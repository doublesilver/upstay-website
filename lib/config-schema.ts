export interface ConfigEntry {
  key: string;
  default: string;
  public: boolean;
  editable: boolean;
}

export const CONFIG_ENTRIES: ConfigEntry[] = [
  { key: "header_logo_visible", default: "1", public: true, editable: true },
  { key: "header_logo_width", default: "100", public: true, editable: true },
  { key: "header_logo_offset_y", default: "0", public: true, editable: true },
  { key: "header_logo_offset_x", default: "0", public: true, editable: true },

  {
    key: "photo_guide_title",
    default: "리모델링 사례보기",
    public: true,
    editable: true,
  },
  {
    key: "photo_guide_caption",
    default: "Before → After",
    public: true,
    editable: true,
  },
  { key: "photo_guide_style", default: "{}", public: true, editable: true },
  {
    key: "photo_guide_caption_style",
    default: "{}",
    public: true,
    editable: true,
  },
  { key: "photo_guide_visible", default: "1", public: true, editable: true },

  {
    key: "service_remodeling_title",
    default: "리모델링",
    public: true,
    editable: true,
  },
  {
    key: "service_remodeling_title_style",
    default: "{}",
    public: true,
    editable: true,
  },
  {
    key: "service_remodeling_desc",
    default:
      "주방, 욕실, 발코니, 타일, 천정, 도배, 바닥, 목공, 몰딩, 도장 등 공사의 관리 모든 것",
    public: true,
    editable: true,
  },
  {
    key: "service_remodeling_desc_style",
    default: "{}",
    public: true,
    editable: true,
  },
  {
    key: "service_remodeling_caption",
    default: "공사의 관리 모든 것",
    public: true,
    editable: true,
  },
  {
    key: "service_remodeling_caption_style",
    default: "{}",
    public: true,
    editable: true,
  },
  {
    key: "service_remodeling_visible",
    default: "1",
    public: true,
    editable: true,
  },

  {
    key: "service_building_title",
    default: "건물관리",
    public: true,
    editable: true,
  },
  {
    key: "service_building_title_style",
    default: "{}",
    public: true,
    editable: true,
  },
  {
    key: "service_building_desc",
    default:
      "설비, 전기, 수도, 주차장, 청소 및 보수, 유지, 하자보수 등 모든 것",
    public: true,
    editable: true,
  },
  {
    key: "service_building_desc_style",
    default: "{}",
    public: true,
    editable: true,
  },
  {
    key: "service_building_caption",
    default: "보수, 유지, 하자보수 등 모든 것",
    public: true,
    editable: true,
  },
  {
    key: "service_building_caption_style",
    default: "{}",
    public: true,
    editable: true,
  },
  {
    key: "service_building_visible",
    default: "1",
    public: true,
    editable: true,
  },

  {
    key: "service_rental_title",
    default: "임대관리",
    public: true,
    editable: true,
  },
  {
    key: "service_rental_title_style",
    default: "{}",
    public: true,
    editable: true,
  },
  {
    key: "service_rental_desc",
    default:
      "공실관리 및 입주자 응대와 시설물관리\n월세 관리비 공과금 정산 및 세대납부,\n민원접수 및 처리, 입주안내문 발송진행",
    public: true,
    editable: true,
  },
  {
    key: "service_rental_desc_style",
    default: "{}",
    public: true,
    editable: true,
  },
  {
    key: "service_rental_caption",
    default: "임대차의 모든 업무",
    public: true,
    editable: true,
  },
  {
    key: "service_rental_caption_style",
    default: "{}",
    public: true,
    editable: true,
  },
  {
    key: "service_rental_visible",
    default: "1",
    public: true,
    editable: true,
  },

  {
    key: "service_category4_title",
    default: "",
    public: true,
    editable: true,
  },
  {
    key: "service_category4_title_style",
    default: "{}",
    public: true,
    editable: true,
  },
  {
    key: "service_category4_desc",
    default: "",
    public: true,
    editable: true,
  },
  {
    key: "service_category4_desc_style",
    default: "{}",
    public: true,
    editable: true,
  },
  {
    key: "service_category4_caption",
    default: "",
    public: true,
    editable: true,
  },
  {
    key: "service_category4_caption_style",
    default: "{}",
    public: true,
    editable: true,
  },
  {
    key: "service_category4_style",
    default: "{}",
    public: true,
    editable: true,
  },
  {
    key: "service_category4_visible",
    default: "1",
    public: true,
    editable: true,
  },

  {
    key: "service_category5_title",
    default: "",
    public: true,
    editable: true,
  },
  {
    key: "service_category5_title_style",
    default: "{}",
    public: true,
    editable: true,
  },
  {
    key: "service_category5_desc",
    default: "",
    public: true,
    editable: true,
  },
  {
    key: "service_category5_desc_style",
    default: "{}",
    public: true,
    editable: true,
  },
  {
    key: "service_category5_caption",
    default: "",
    public: true,
    editable: true,
  },
  {
    key: "service_category5_caption_style",
    default: "{}",
    public: true,
    editable: true,
  },
  {
    key: "service_category5_style",
    default: "{}",
    public: true,
    editable: true,
  },
  {
    key: "service_category5_visible",
    default: "0",
    public: true,
    editable: true,
  },

  {
    key: "service_categories_order",
    default:
      '["service_remodeling","service_building","service_rental","service_category4","service_category5"]',
    public: true,
    editable: true,
  },

  { key: "footer_name", default: "업스테이", public: true, editable: true },
  {
    key: "footer_english_name",
    default: "up stay",
    public: true,
    editable: true,
  },
  { key: "footer_ceo", default: "이동훈", public: true, editable: true },
  {
    key: "footer_address",
    default: "서울시 강남구 논현로 26길 82 (도곡동 157-26번지) 1층",
    public: true,
    editable: true,
  },
  {
    key: "footer_business_number",
    default: "308-25-02055",
    public: true,
    editable: true,
  },
  {
    key: "footer_phone",
    default: "010-3168-0624",
    public: true,
    editable: true,
  },
  { key: "footer_label_name", default: "", public: true, editable: true },
  { key: "footer_label_ceo", default: "", public: true, editable: true },
  { key: "footer_label_address", default: "", public: true, editable: true },
  {
    key: "footer_label_business_number",
    default: "",
    public: true,
    editable: true,
  },
  { key: "footer_label_phone", default: "", public: true, editable: true },
  {
    key: "footer_label_name_spacing",
    default: "0.4em",
    public: true,
    editable: true,
  },
  {
    key: "footer_label_ceo_spacing",
    default: "0em",
    public: true,
    editable: true,
  },
  {
    key: "footer_label_address_spacing",
    default: "1.7em",
    public: true,
    editable: true,
  },
  {
    key: "footer_label_business_number_spacing",
    default: "0em",
    public: true,
    editable: true,
  },
  {
    key: "footer_label_phone_spacing",
    default: "0.85em",
    public: true,
    editable: true,
  },
  {
    key: "footer_colon_left_offset",
    default: "0px",
    public: true,
    editable: true,
  },
  {
    key: "footer_colon_right_offset",
    default: "0px",
    public: true,
    editable: true,
  },
];

export const PUBLIC_KEYS = new Set(
  CONFIG_ENTRIES.filter((e) => e.public).map((e) => e.key),
);

export const ALLOWED_KEYS = new Set(
  CONFIG_ENTRIES.filter((e) => e.editable).map((e) => e.key),
);

export const DEFAULT_CONFIG: Record<string, string> = Object.fromEntries(
  CONFIG_ENTRIES.map((e) => [e.key, e.default]),
);

export type ConfigRecord = Record<string, string>;
