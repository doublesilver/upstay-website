import {
  buildingManagementItems,
  rentalManagementItems,
  remodelingServiceItems,
} from "@/lib/content";

type Item = { title: string; description: string };

interface SiteConfig {
  [key: string]: string;
}

interface ServiceSectionsProps {
  config?: SiteConfig;
}

function ServiceSection({
  title,
  caption,
  items,
}: {
  title: string;
  caption: string;
  items: Item[];
}) {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl px-4 py-2.5 md:px-6 md:py-3.5">
      <div className="flex items-baseline justify-between mb-1.5 md:mb-2">
        <h2 className="text-[14px] md:text-[17px] font-bold tracking-tight text-[#111111]">
          {title}
        </h2>
        <p className="text-[9px] md:text-[11px] text-[#6B7280]">{caption}</p>
      </div>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-0.5 md:gap-y-1">
        {items.map((item) => (
          <li
            key={item.title}
            className="flex items-baseline gap-1.5 md:gap-2 text-[11px] md:text-[13px]"
          >
            <span className="text-[#6B7280] shrink-0">•</span>
            <span className="font-medium text-[#111111]">{item.title}</span>
            <span className="text-[#D1D5DB]">—</span>
            <span className="text-[#6B7280] truncate">{item.description}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ServiceSections({ config }: ServiceSectionsProps) {
  const remodelingItems = config?.remodeling_items
    ? JSON.parse(config.remodeling_items)
    : remodelingServiceItems;
  const buildingItems = config?.building_items
    ? JSON.parse(config.building_items)
    : buildingManagementItems;
  const rentalItems = config?.rental_items
    ? JSON.parse(config.rental_items)
    : rentalManagementItems;

  return (
    <div className="space-y-2 md:space-y-3">
      <ServiceSection
        title={config?.service_remodeling_title ?? "리모델링"}
        caption={config?.service_remodeling_caption ?? "공사에 관한 모든 것"}
        items={remodelingItems}
      />
      <ServiceSection
        title={config?.service_building_title ?? "건물관리"}
        caption={config?.service_building_caption ?? "수선 · 유지 · 하자보수"}
        items={buildingItems}
      />
      <ServiceSection
        title={config?.service_rental_title ?? "임대관리"}
        caption={config?.service_rental_caption ?? "공실 · 입퇴실 · 민원"}
        items={rentalItems}
      />
    </div>
  );
}
