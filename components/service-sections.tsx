import { type TextStyle, parseStyle, styleToCss } from "@/lib/text-style";

interface SiteConfig {
  [key: string]: string;
}

interface ServiceSectionsProps {
  config?: SiteConfig;
}

function isVisible(value?: string) {
  return value !== "0";
}

function ServiceSection({
  title,
  description,
  caption,
  titleStyle,
  descStyle,
  captionStyle,
}: {
  title: string;
  description: string;
  caption?: string;
  titleStyle?: TextStyle;
  descStyle?: TextStyle;
  captionStyle?: TextStyle;
}) {
  const ts = titleStyle || {};
  const ds = descStyle || {};
  const cs = captionStyle || {};

  return (
    <div className="bg-[#F1F8E9] border border-[#111111] rounded-xl px-4 py-2.5 md:px-6 md:py-3.5">
      <div className="flex items-baseline justify-between mb-1.5 gap-3">
        <h2
          className="text-[14px] md:text-[17px] font-bold tracking-tight text-[#111111]"
          style={styleToCss(ts)}
        >
          {title}
        </h2>
        {caption && (
          <span
            className="text-[11px] md:text-[13px] text-[#111] font-normal"
            style={styleToCss(cs)}
          >
            {caption}
          </span>
        )}
      </div>
      <div className="bg-white border border-[#111111] rounded-lg px-3 py-2 md:px-4 md:py-2.5">
        <p
          className="text-[12px] md:text-[14px] font-bold text-[#111111] leading-relaxed whitespace-pre-line"
          style={styleToCss(ds)}
        >
          {description}
        </p>
      </div>
    </div>
  );
}

const DEFAULT_REMODELING_DESC =
  "주방, 욕실, 발코니, 타일, 천정, 도배, 바닥, 목공, 몰딩, 도장 등 공사의 관리 모든 것";
const DEFAULT_BUILDING_DESC =
  "설비, 전기, 수도, 주차장, 청소 및 보수, 유지, 하자보수 등 모든 것";
const DEFAULT_RENTAL_DESC =
  "공실관리 및 입주자 응대와 시설물관리\n월세 관리비 공과금 정산 및 세대납부,\n민원접수 및 처리, 입주안내문 발송진행";

const DEFAULT_ORDER = [
  "service_remodeling",
  "service_building",
  "service_rental",
  "service_category4",
  "service_category5",
];

export function ServiceSections({ config }: ServiceSectionsProps) {
  const allSections = {
    service_remodeling: {
      key: "service_remodeling",
      visible: isVisible(config?.service_remodeling_visible),
      title: config?.service_remodeling_title ?? "리모델링",
      description: config?.service_remodeling_desc ?? DEFAULT_REMODELING_DESC,
      caption: config?.service_remodeling_caption ?? "공사의 관리 모든 것",
      titleStyle: parseStyle(config?.service_remodeling_title_style),
      descStyle: parseStyle(config?.service_remodeling_desc_style),
      captionStyle: parseStyle(config?.service_remodeling_caption_style),
    },
    service_building: {
      key: "service_building",
      visible: isVisible(config?.service_building_visible),
      title: config?.service_building_title ?? "건물관리",
      description: config?.service_building_desc ?? DEFAULT_BUILDING_DESC,
      caption:
        config?.service_building_caption ?? "보수, 유지, 하자보수 등 모든 것",
      titleStyle: parseStyle(config?.service_building_title_style),
      descStyle: parseStyle(config?.service_building_desc_style),
      captionStyle: parseStyle(config?.service_building_caption_style),
    },
    service_rental: {
      key: "service_rental",
      visible: isVisible(config?.service_rental_visible),
      title: config?.service_rental_title ?? "임대관리",
      description: config?.service_rental_desc ?? DEFAULT_RENTAL_DESC,
      caption: config?.service_rental_caption ?? "임대차의 모든 업무",
      titleStyle: parseStyle(config?.service_rental_title_style),
      descStyle: parseStyle(config?.service_rental_desc_style),
      captionStyle: parseStyle(config?.service_rental_caption_style),
    },
    service_category4: {
      key: "service_category4",
      visible: isVisible(config?.service_category4_visible),
      title: config?.service_category4_title ?? "",
      description: config?.service_category4_desc ?? "",
      caption: config?.service_category4_caption ?? "",
      titleStyle: parseStyle(config?.service_category4_title_style),
      descStyle: parseStyle(config?.service_category4_desc_style),
      captionStyle: parseStyle(config?.service_category4_caption_style),
    },
    service_category5: {
      key: "service_category5",
      visible: isVisible(config?.service_category5_visible),
      title: config?.service_category5_title ?? "",
      description: config?.service_category5_desc ?? "",
      caption: config?.service_category5_caption ?? "",
      titleStyle: parseStyle(config?.service_category5_title_style),
      descStyle: parseStyle(config?.service_category5_desc_style),
      captionStyle: parseStyle(config?.service_category5_caption_style),
    },
  };

  let order: string[];
  try {
    const parsed = JSON.parse(config?.service_categories_order || "[]");
    order = Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_ORDER;
  } catch {
    order = DEFAULT_ORDER;
  }

  const sections = order
    .filter((key): key is keyof typeof allSections => key in allSections)
    .map((key) => allSections[key])
    .filter(
      (section) =>
        section.visible && (section.title.trim() || section.description.trim()),
    );

  return (
    <div className="space-y-2 md:space-y-3">
      {sections.map((section) => (
        <ServiceSection
          key={section.key}
          title={section.title}
          description={section.description}
          caption={section.caption}
          titleStyle={section.titleStyle}
          descStyle={section.descStyle}
          captionStyle={section.captionStyle}
        />
      ))}
    </div>
  );
}
