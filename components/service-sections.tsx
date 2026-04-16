interface SiteConfig {
  [key: string]: string;
}

interface ServiceSectionsProps {
  config?: SiteConfig;
}

function ServiceSection({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="bg-[#fdf6ee] border border-[#e8ddd0] rounded-xl px-4 py-2.5 md:px-6 md:py-3.5">
      <h2 className="text-[14px] md:text-[17px] font-bold tracking-tight text-[#111111] mb-1.5">
        <span className="mr-1.5 text-[8px] md:text-[10px] align-middle">●</span>
        {title}
      </h2>
      <div className="bg-white border border-[#e8ddd0] rounded-lg px-3 py-2 md:px-4 md:py-2.5">
        <p className="text-[12px] md:text-[14px] font-bold text-[#111111] leading-relaxed whitespace-pre-line">
          {description}
        </p>
      </div>
    </div>
  );
}

const DEFAULT_REMODELING_DESC =
  "주방, 욕실, 베란다, 현관, 천정, 도배, 바닥, 구멍, 몰딩, 샷시 등 공사에 관한 모든 것";
const DEFAULT_BUILDING_DESC =
  "설비, 전기, 수도, 주차, 청소 등 수선, 유지, 하자보수의 모든 것";
const DEFAULT_RENTAL_DESC =
  "공실관리, 입퇴실 시 입주자 및 시설물관리,\n월세 관리비 공과금 정산 및 수납독촉,\n민원접수 및 처리, 악성연체자 소송진행";

export function ServiceSections({ config }: ServiceSectionsProps) {
  return (
    <div className="space-y-2 md:space-y-3">
      <ServiceSection
        title={config?.service_remodeling_title ?? "리모델링"}
        description={config?.service_remodeling_desc ?? DEFAULT_REMODELING_DESC}
      />
      <ServiceSection
        title={config?.service_building_title ?? "건물관리"}
        description={config?.service_building_desc ?? DEFAULT_BUILDING_DESC}
      />
      <ServiceSection
        title={config?.service_rental_title ?? "임대관리"}
        description={config?.service_rental_desc ?? DEFAULT_RENTAL_DESC}
      />
    </div>
  );
}
