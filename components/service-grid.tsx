import { ServiceItem } from "@/components/service-item";

type ServiceGridItem = {
  title: string;
  description: string;
};

type ServiceGridProps = {
  items: ServiceGridItem[];
  variant?: "grid" | "list";
};

export function ServiceGrid({ items, variant = "grid" }: ServiceGridProps) {
  if (variant === "list") {
    return (
      <div className="grid gap-3">
        {items.map((item) => (
          <ServiceItem key={item.title} title={item.title} description={item.description} variant={variant} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => (
        <ServiceItem key={item.title} title={item.title} description={item.description} variant={variant} />
      ))}
    </div>
  );
}
