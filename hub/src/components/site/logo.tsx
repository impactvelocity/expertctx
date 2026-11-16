import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-7", className)}>
      <rect width="32" height="32" rx="9" className="fill-brand" />
      <circle cx="11" cy="12" r="3.2" className="fill-brand-foreground/70" />
      <circle cx="21" cy="12" r="3.2" className="fill-brand-foreground/70" />
      <circle cx="16" cy="21" r="4.2" className="fill-brand-foreground" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2", className)}>
      <LogoMark />
      <span className="font-display text-lg">ExpertCTX</span>
    </Link>
  );
}
