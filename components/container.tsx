import { cn } from "@/lib/utils";

type ContainerProps = {
  children: React.ReactNode;
  className?: string;
};

export function Container({ children, className }: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[420px] px-5 md:max-w-[1040px] md:px-10",
        className,
      )}
    >
      {children}
    </div>
  );
}
