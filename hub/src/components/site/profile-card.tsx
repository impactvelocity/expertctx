import Link from "next/link";
import { BookOpen, ListChecks, ScrollText } from "lucide-react";
import { frameworkNames, bulletCount } from "@/lib/frameworks";
import type { ProfileWithExpert } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ExpertAvatar } from "./expert-avatar";
import { VerifiedBadge } from "./verified-badge";

const TILES = [
  "bg-brand/12 text-brand",
  "bg-ctx-expert/12 text-ctx-expert",
  "bg-ctx-team/14 text-ctx-team",
  "bg-ctx-goal/22 text-warning-foreground",
];

export function profileTile(id: string) {
  return TILES[[...id].reduce((n, c) => n + c.charCodeAt(0), 0) % TILES.length];
}

/** A marketplace listing: profile tile, name, expert, what's inside. */
export function ProfileCard({ profile }: { profile: ProfileWithExpert }) {
  const frameworks = frameworkNames(profile.frameworks);
  return (
    <article className="group relative flex h-full flex-col rounded-xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-lg hover:shadow-navy/5">
      <Link
        href={`/experts/${profile.expert.slug}#${profile.id}`}
        className="absolute inset-0 z-10 rounded-xl"
        aria-label={`${profile.expert.name}: ${profile.title}`}
      />
      <div className="flex items-start gap-3.5">
        <div className={cn("flex size-12 shrink-0 items-center justify-center rounded-xl font-display text-xl", profileTile(profile.id))}>
          {profile.title[0]}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-lg leading-tight group-hover:text-brand">{profile.title}</h3>
          <p className="truncate text-muted-foreground text-sm">by {profile.expert.name}</p>
        </div>
      </div>
      <p className="mt-4 line-clamp-2 text-sm">{profile.tagline}</p>
      {frameworks.length ? (
        <p className="mt-2 line-clamp-1 text-muted-foreground text-xs">{frameworks.join(" · ")}</p>
      ) : null}
      <div className="mt-auto flex items-center gap-4 border-t pt-3.5 text-muted-foreground text-xs [&_svg]:size-3.5" style={{ marginTop: "1.25rem" }}>
        <span className="inline-flex items-center gap-1" title="Frameworks">
          <BookOpen aria-hidden />
          {frameworks.length}
        </span>
        <span className="inline-flex items-center gap-1" title="Rules">
          <ScrollText aria-hidden />
          {bulletCount(profile.rules)}
        </span>
        <span className="inline-flex items-center gap-1" title="Playbooks">
          <ListChecks aria-hidden />
          {profile.playbooks.length}
        </span>
        <span className="ml-auto flex items-center gap-1.5">
          <ExpertAvatar expert={profile.expert} className="size-5 text-[9px]" />
          <VerifiedBadge verified={profile.expert.verified} kind={profile.expert.kind} />
        </span>
      </div>
    </article>
  );
}
