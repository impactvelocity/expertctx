import Link from "next/link";
import { ArrowUpRight, BookOpen, ListChecks } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardPanel } from "@/components/ui/card";
import { frameworkNames } from "@/lib/frameworks";
import type { ProfileWithExpert } from "@/lib/types";
import { ExpertAvatar } from "./expert-avatar";
import { VerifiedBadge } from "./verified-badge";

export function ProfileCard({ profile }: { profile: ProfileWithExpert }) {
  const frameworks = frameworkNames(profile.frameworks);
  return (
    <Card className="group transition-shadow hover:shadow-md">
      <Link href={`/experts/${profile.expert.slug}#${profile.id}`} className="absolute inset-0 z-10 rounded-2xl" aria-label={`${profile.expert.name}: ${profile.title}`} />
      <CardPanel className="flex h-full flex-col gap-4 p-5">
        <div className="flex items-start gap-3">
          <ExpertAvatar expert={profile.expert} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate font-medium text-sm">{profile.expert.name}</p>
              <VerifiedBadge verified={profile.expert.verified} kind={profile.expert.kind} />
            </div>
            <p className="truncate text-muted-foreground text-xs">{profile.expert.headline}</p>
          </div>
          <ArrowUpRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
        <div className="space-y-1.5">
          <h3 className="font-display text-xl">{profile.title}</h3>
          <p className="line-clamp-2 text-muted-foreground text-sm">{profile.tagline}</p>
        </div>
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 text-muted-foreground text-xs">
          <span className="inline-flex items-center gap-1.5">
            <BookOpen className="size-3.5" aria-hidden />
            {frameworks.length} framework{frameworks.length === 1 ? "" : "s"}
          </span>
          {profile.playbooks.length ? (
            <span className="inline-flex items-center gap-1.5">
              <ListChecks className="size-3.5" aria-hidden />
              {profile.playbooks.length} playbook{profile.playbooks.length === 1 ? "" : "s"}
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {profile.topics.slice(0, 4).map((topic) => (
            <Badge key={topic} variant="secondary">
              {topic}
            </Badge>
          ))}
        </div>
      </CardPanel>
    </Card>
  );
}
