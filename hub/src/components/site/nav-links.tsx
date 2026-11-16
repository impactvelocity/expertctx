"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/experts", label: "Marketplace", match: "/experts" },
  { href: "/install", label: "For teams", match: "/install" },
  { href: "/for-experts", label: "For experts", match: "/for-experts" },
  { href: "/studio", label: "Studio", match: "/studio" },
];

/** Top-nav links with a selected bar under the current section. */
export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="hidden h-full items-stretch gap-1 md:flex">
      {NAV.map((item) => {
        const active = pathname === item.match || pathname.startsWith(`${item.match}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex items-center rounded-md px-2.5 font-medium text-sm transition-colors",
              "my-2.5 text-muted-foreground hover:bg-accent hover:text-foreground",
              active && "text-brand hover:text-brand",
              "after:absolute after:inset-x-2 after:-bottom-2.5 after:h-0.5 after:rounded-full",
              active && "after:bg-brand",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
