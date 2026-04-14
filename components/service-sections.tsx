import {
  buildingManagementItems,
  rentalManagementItems,
  remodelingServiceItems,
} from "@/lib/content";

type Item = { title: string; description: string };

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
    <div className="bg-white border border-[#E5E7EB] rounded-xl px-5 py-3.5 md:px-6 md:py-4">
      <div className="flex items-baseline justify-between mb-2">
        <h2 className="text-[15px] md:text-[17px] font-bold tracking-tight text-[#111111]">
          {title}
        </h2>
        <p className="text-[10px] md:text-[11px] text-[#6B7280]">{caption}</p>
      </div>
      <ul className="space-y-1">
        {items.map((item) => (
          <li
            key={item.title}
            className="flex items-baseline gap-2 text-[12px] md:text-[13px]"
          >
            <span className="text-[#6B7280] shrink-0">•</span>
            <span className="font-medium text-[#111111]">{item.title}</span>
            <span className="text-[#D1D5DB]">—</span>
            <span className="text-[#6B7280]">{item.description}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ServiceSections() {
  return (
    <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-3 md:gap-4">
      <ServiceSection
        title="리모델링"
        caption="공사에 관한 모든 것"
        items={remodelingServiceItems}
      />
      <ServiceSection
        title="건물관리"
        caption="수선 · 유지 · 하자보수"
        items={buildingManagementItems}
      />
      <ServiceSection
        title="임대관리"
        caption="공실 · 입퇴실 · 민원"
        items={rentalManagementItems}
      />
    </div>
  );
}
