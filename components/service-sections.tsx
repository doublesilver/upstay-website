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

function ServiceSection({ title, items }: { title: string; items: Item[] }) {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl px-4 py-2.5 md:px-6 md:py-3.5">
      <h2 className="text-[14px] md:text-[17px] font-bold tracking-tight text-[#111111] mb-1.5 md:mb-2">
        {title}
      </h2>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-0.5 md:gap-y-1">
        {items.map((item) => (
          <li
            key={item.title}
            className="flex items-baseline gap-1.5 md:gap-2 text-[11px] md:text-[13px]"
          >
            <span className="text-[#6B7280] shrink-0">•</span>
            <span className="font-medium text-[#111111]">• {item.title}</span>
            <span className="text-[#D1D5DB]">—</span>
            <span className="text-[#6B7280]">{item.description}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ServiceSections({ config }: ServiceSectionsProps) {
  const remodelingItems: Item[] = config?.remodeling_items
    ? JSON.parse(config.remodeling_items)
    : remodelingServiceItems;
  const buildingItems: Item[] = config?.building_items
    ? JSON.parse(config.building_items)
    : buildingManagementItems;
  const rentalItems: Item[] = config?.rental_items
    ? JSON.parse(config.rental_items)
    : rentalManagementItems;

  return (
    <div className="space-y-2 md:space-y-3">
      <ServiceSection
        title={config?.service_remodeling_title ?? "리모델링"}
        items={remodelingItems}
      />
      <ServiceSection
        title={config?.service_building_title ?? "건물관리"}
        items={buildingItems}
      />
      <ServiceSection
        title={config?.service_rental_title ?? "임대관리"}
        items={rentalItems}
      />
    </div>
  );
}
