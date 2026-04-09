import { cn } from "@/lib/utils";

type ServiceItemProps = {
  title: string;
  description: string;
  variant?: "grid" | "list";
};

export function ServiceItem({ title, description, variant = "grid" }: ServiceItemProps) {
  return (
    <article
      className={cn(
        "rounded-[16px] border border-stone-200 bg-white",
        variant === "grid" ? "min-h-[132px] px-4 py-4" : "px-4 py-3.5",
      )}
    >
      <div className="flex gap-3">
        <span className="mt-1 inline-flex size-2.5 shrink-0 rounded-full bg-stone-700" />
        <div className="space-y-1">
          <h3 className="text-[15px] font-semibold tracking-[-0.02em] text-stone-900">{title}</h3>
          <p className="text-[13px] leading-5 text-stone-600">{description}</p>
        </div>
      </div>
    </article>
  );
}
