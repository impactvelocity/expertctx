import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The ExpertCTX mark: the expert at the centre (solid dot), with the team's
 * and the goal's context around it (two open arcs). Reads as "context rings".
 */
export function LogoMark({ className, mono = false }: { className?: string; mono?: boolean }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-7 shrink-0", className)}>
      <defs>
        <linearGradient id="ectx-g" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--brand)" />
          <stop offset="1" stopColor="var(--ctx-expert)" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill={mono ? "currentColor" : "url(#ectx-g)"} />
      <path d="M16 6.5a9.5 9.5 0 0 1 9.5 9.5" fill="none" stroke="white" strokeOpacity=".6" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M16 25.5A9.5 9.5 0 0 1 6.5 16" fill="none" stroke="white" strokeOpacity=".6" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="16" cy="16" r="4.3" fill="white" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-display text-[1.125rem] leading-none tracking-tight", className)}>
      Expert<span className="text-brand">CTX</span>
    </span>
  );
}

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring", className)}>
      <LogoMark />
      <Wordmark />
    </Link>
  );
}
