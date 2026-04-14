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
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 md:p-6">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-[16px] md:text-[18px] font-bold tracking-tight text-[#111111]">
          {title}
        </h2>
        <p className="text-[11px] md:text-[12px] text-[#6B7280]">{caption}</p>
      </div>
      <ul className="space-y-2.5">
        {items.map((item) => (
          <li key={item.title} className="text-[13px] md:text-[14px]">
            <div className="flex items-baseline gap-2">
              <span className="text-[#6B7280] shrink-0">•</span>
              <span className="font-medium text-[#111111]">{item.title}</span>
            </div>
            <p className="ml-5 mt-0.5 text-[12px] md:text-[13px] text-[#6B7280] leading-[1.5]">
              {item.description}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ServiceSections() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
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
