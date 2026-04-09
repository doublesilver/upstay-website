import { buildingManagementItems, rentalManagementItems } from "@/lib/content";

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
    <section>
      <div className="flex items-baseline justify-between">
        <h2 className="text-[18px] md:text-[22px] font-bold tracking-tight text-[#111111]">
          {title}
        </h2>
        <p className="text-[11px] md:text-[12px] text-[#6B7280]">{caption}</p>
      </div>
      <ul className="mt-4 border-t border-[#E5E7EB]">
        {items.map((item) => (
          <li
            key={item.title}
            className="border-b border-[#E5E7EB] py-4 md:py-5"
          >
            <div className="flex items-start gap-3">
              <span className="mt-1 text-[#6B7280] shrink-0">—</span>
              <div>
                <h3 className="text-[15px] md:text-[16px] font-medium text-[#111111]">
                  {item.title}
                </h3>
                <p className="mt-1 text-[13px] text-[#6B7280] leading-[1.6]">
                  {item.description}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ServiceSections() {
  return (
    <div className="space-y-16">
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
