import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Expert } from "@/lib/types";

const TINTS = [
  "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200",
  "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200",
  "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200",
];

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function ExpertAvatar({ expert, className }: { expert: Pick<Expert, "id" | "name" | "avatarPath">; className?: string }) {
  const tint = TINTS[[...expert.id].reduce((n, c) => n + c.charCodeAt(0), 0) % TINTS.length];
  return (
    <Avatar className={cn("size-10", className)}>
      {expert.avatarPath ? <AvatarImage src={`/api/avatar/${expert.id}?v=${encodeURIComponent(expert.avatarPath)}`} alt="" /> : null}
      <AvatarFallback className={cn("font-medium", tint)}>{initials(expert.name)}</AvatarFallback>
    </Avatar>
  );
}
