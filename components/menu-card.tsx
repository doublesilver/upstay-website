import Link from "next/link";

type MenuCardProps = {
  title: string;
  subtitle: string;
  href: string;
};

export function MenuCard({ title, subtitle, href }: MenuCardProps) {
  return (
    <Link
      href={href}
      className="group relative block aspect-[4/3] border border-[#E5E7EB] p-5 hover:border-[#111111] transition-colors md:aspect-auto md:min-h-[180px]"
    >
      <h2 className="text-[18px] font-bold tracking-tight text-[#111111]">
        {title}
      </h2>
      <p className="absolute bottom-5 left-5 text-[13px] text-[#6B7280]">
        {subtitle}
      </p>
      <span
        aria-hidden="true"
        className="absolute bottom-5 right-5 text-[16px] text-[#111111]"
      >
        →
      </span>
    </Link>
  );
}
