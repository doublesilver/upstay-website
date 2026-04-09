type SectionHeadingProps = {
  id: string;
  label: string;
  title: string;
  description: string;
};

export function SectionHeading({ id, label, title, description }: SectionHeadingProps) {
  return (
    <header className="max-w-xl space-y-2">
      <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-stone-500">{label}</p>
      <h2 id={id} className="text-[1.5rem] leading-[1.24] font-semibold tracking-[-0.03em] text-stone-900">
        {title}
      </h2>
      <p className="text-[14px] leading-6 text-stone-600 sm:text-[15px]">{description}</p>
    </header>
  );
}
