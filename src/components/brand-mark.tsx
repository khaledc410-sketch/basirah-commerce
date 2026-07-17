import { cn } from "@/lib/utils";

interface BrandMarkProps {
  className?: string;
  compact?: boolean;
}

export function BrandMark({ className, compact = false }: BrandMarkProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg
        aria-hidden="true"
        className="size-9 shrink-0"
        viewBox="0 0 40 40"
        fill="none"
      >
        <rect width="40" height="40" rx="12" fill="currentColor" />
        <path
          d="M10.5 20c2.8-5.2 6-7.8 9.5-7.8s6.7 2.6 9.5 7.8c-2.8 5.2-6 7.8-9.5 7.8S13.3 25.2 10.5 20Z"
          stroke="white"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <circle cx="20" cy="20" r="3.6" fill="white" />
      </svg>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="text-lg font-bold tracking-tight">بصيرة</span>
          <span className="mt-1 text-[10px] font-medium text-muted-foreground">
            ظهور التجارة
          </span>
        </span>
      )}
    </span>
  );
}
