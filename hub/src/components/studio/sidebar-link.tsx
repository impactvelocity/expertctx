"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function SidebarLink({
  href,
  exact = false,
  icon,
  children,
  trailing,
  external = false,
}: {
  href: string;
  exact?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
  trailing?: React.ReactNode;
  external?: boolean;
}) {
  const pathname = usePathname();
  const active = !external && (exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex h-8 items-center gap-2.5 rounded-md px-2 text-sm transition-colors",
        "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground",
        active && "bg-brand/10 font-medium text-brand hover:bg-brand/12 hover:text-brand",
        "[&_svg]:size-4 [&_svg]:shrink-0",
      )}
    >
      {active ? <span aria-hidden className="absolute top-1.5 bottom-1.5 left-0 w-0.5 rounded-full bg-brand" /> : null}
      {icon}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {trailing}
    </Link>
  );
}
