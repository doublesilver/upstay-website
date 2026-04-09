type BeforeAfterItem = {
  title: string;
  description: string;
  before: string;
  after: string;
};

type BeforeAfterCardProps = {
  item: BeforeAfterItem;
};

export function BeforeAfterCard({ item }: BeforeAfterCardProps) {
  return (
    <article className="rounded-[18px] border border-stone-300 bg-white p-4 shadow-[0_8px_24px_rgba(17,24,39,0.04)]">
      <div className="flex items-start justify-between gap-3 border-b border-stone-200 pb-3">
        <div className="space-y-1">
          <h3 className="text-[15px] font-semibold tracking-[-0.02em] text-stone-900">{item.title}</h3>
          <p className="max-w-md text-[14px] leading-6 text-stone-600">{item.description}</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">Before</p>
          <div className="aspect-[4/5] rounded-[14px] border border-dashed border-stone-300 bg-[var(--surface-muted)] p-3">
            <div className="flex h-full flex-col justify-between rounded-[10px] border border-stone-200 bg-white p-3">
              <div className="h-2 w-14 rounded-full bg-stone-200" />
              <div className="space-y-2">
                <div className="h-24 rounded-[8px] border border-stone-200 bg-stone-100" />
                <p className="text-[12px] leading-5 text-stone-500">{item.before}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">After</p>
          <div className="aspect-[4/5] rounded-[14px] border border-stone-300 bg-white p-3">
            <div className="flex h-full flex-col justify-between rounded-[10px] border border-stone-200 bg-[var(--surface-muted)] p-3">
              <div className="h-2 w-14 rounded-full bg-stone-300" />
              <div className="space-y-2">
                <div className="h-24 rounded-[8px] border border-stone-300 bg-white" />
                <p className="text-[12px] leading-5 text-stone-700">{item.after}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
