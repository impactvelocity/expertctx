import { cn } from "@/lib/utils";

const APPEARANCE = {
  default: "bg-navy/8 text-navy/80",
  success: "bg-success/15 text-success-foreground",
  inprogress: "bg-brand/12 text-brand",
  new: "bg-ctx-expert/14 text-ctx-expert",
  moved: "bg-warning/22 text-warning-foreground",
  removed: "bg-destructive/12 text-destructive-foreground",
} as const;

/** Small uppercase status label, for states like PUBLISHED or DRAFT. */
export function Lozenge({
  appearance = "default",
  bold = false,
  className,
  children,
}: {
  appearance?: keyof typeof APPEARANCE;
  bold?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-[18px] shrink-0 items-center gap-1 rounded-[3px] px-1.5 font-semibold text-[11px] uppercase leading-none tracking-[0.02em] [&_svg]:size-3",
        APPEARANCE[appearance],
        bold && "brightness-95",
        className,
      )}
    >
      {children}
    </span>
  );
}
