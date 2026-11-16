import type { Metadata } from "next";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { Activity, ArrowRight, Eye, FileText, Layers, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardPanel, CardTitle } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { ExpertAvatar } from "@/components/site/expert-avatar";
import { VerifiedBadge } from "@/components/site/verified-badge";
import { ClaimButton } from "@/components/studio/claim-button";
import { ExpertForm } from "@/components/studio/expert-form";
import { NewProfileDialog } from "@/components/studio/new-profile-dialog";
import { isAdmin, requireUserId } from "@/lib/auth";
import { countSources, getExpertByOwner, getUsage, listExperts, listProfilesForExpert } from "@/lib/data";
import { frameworkNames } from "@/lib/frameworks";

export const metadata: Metadata = { title: "Studio" };

export default async function StudioPage() {
  const userId = await requireUserId();
  const expert = await getExpertByOwner(userId);

  if (!expert) {
    const [user, admin] = await Promise.all([currentUser(), isAdmin()]);
    const unclaimed = admin ? (await listExperts()).filter((e) => !e.ownerUserId) : [];
    return (
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="space-y-2">
          <p className="font-medium text-brand text-sm">Welcome to the studio</p>
          <h1 className="font-display text-4xl">Set up your expert profile</h1>
          <p className="text-muted-foreground">
            This is how teams will see you in the marketplace and in Rovo answers. You&apos;ll add your knowledge next.
          </p>
        </div>
        {unclaimed.length ? (
          <Card className="border-brand/40">
            <CardHeader>
              <CardTitle>Seeded experts waiting for an owner</CardTitle>
              <CardDescription>You&apos;re an admin, so you can take over one of these instead of starting fresh.</CardDescription>
            </CardHeader>
            <CardPanel className="space-y-3">
              {unclaimed.map((e) => (
                <div key={e.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <ExpertAvatar expert={e} className="size-9" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm">{e.name}</p>
                    <p className="truncate text-muted-foreground text-xs">{e.headline}</p>
                  </div>
                  <ClaimButton expertId={e.id} />
                </div>
              ))}
            </CardPanel>
          </Card>
        ) : null}
        <Card>
          <CardPanel className="p-6 sm:p-8">
            <ExpertForm defaultName={[user?.firstName, user?.lastName].filter(Boolean).join(" ")} />
          </CardPanel>
        </Card>
      </div>
    );
  }

  const profiles = await listProfilesForExpert(expert.id);
  const ids = profiles.map((p) => p.id);
  const [usage, sourceCounts] = await Promise.all([getUsage(ids), countSources(ids)]);
  const totalCalls = Object.values(usage).reduce((n, u) => n + u.calls, 0);
  const published = profiles.filter((p) => p.status === "published");

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-center">
        <ExpertAvatar expert={expert} className="size-16 text-lg" />
        <div className="flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-3xl">{expert.name}</h1>
            <VerifiedBadge verified={expert.verified} kind={expert.kind} />
          </div>
          <p className="text-muted-foreground">{expert.headline}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {published.length ? (
            <Button variant="outline" render={<Link href={`/experts/${expert.slug}`} />}>
              <Eye aria-hidden />
              Public page
            </Button>
          ) : null}
          <Button variant="outline" render={<Link href="/studio/expert" />}>
            <Pencil aria-hidden />
            Edit details
          </Button>
          <NewProfileDialog />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon={<Layers aria-hidden />} label="Profiles" value={`${profiles.length}`} hint={`${published.length} published`} />
        <Stat
          icon={<FileText aria-hidden />}
          label="Sources"
          value={`${Object.values(sourceCounts).reduce((a, b) => a + b, 0)}`}
          hint="Searched by meaning"
        />
        <Stat icon={<Activity aria-hidden />} label="Agent calls this month" value={`${totalCalls}`} hint="From teams in Rovo" />
      </div>

      {profiles.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {profiles.map((profile) => (
            <Card key={profile.id} className="group">
              <Link href={`/studio/profiles/${profile.id}`} className="absolute inset-0 z-10 rounded-2xl" aria-label={`Edit ${profile.title}`} />
              <CardPanel className="space-y-4 p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h2 className="font-display text-2xl">{profile.title}</h2>
                    <p className="line-clamp-2 text-muted-foreground text-sm">{profile.tagline || "No tagline yet"}</p>
                  </div>
                  {profile.status === "published" ? <Badge variant="success">Published</Badge> : <Badge variant="outline">Draft</Badge>}
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-muted-foreground text-xs">
                  <span>{plural(frameworkNames(profile.frameworks).length, "framework")}</span>
                  <span>{plural(profile.playbooks.length, "playbook")}</span>
                  <span>{plural(sourceCounts[profile.id] ?? 0, "source")}</span>
                  <span>
                    {plural(usage[profile.id]?.calls ?? 0, "call")} · {plural(usage[profile.id]?.sites ?? 0, "site")} this month
                  </span>
                </div>
                <div className="flex items-center gap-1 font-medium text-sm">
                  Edit profile
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </div>
              </CardPanel>
            </Card>
          ))}
        </div>
      ) : (
        <Empty className="rounded-2xl border border-dashed bg-background py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Layers aria-hidden />
            </EmptyMedia>
            <EmptyTitle>Create your first profile</EmptyTitle>
            <EmptyDescription>
              A profile is one job you&apos;re great at, like Launch or Product design. Add frameworks, rules, red flags,
              playbooks and sources to it.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <NewProfileDialog />
          </EmptyContent>
        </Empty>
      )}
    </div>
  );
}

function Stat({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint: string }) {
  return (
    <Card>
      <CardPanel className="flex items-center gap-4 p-5">
        <div className="flex size-10 items-center justify-center rounded-xl bg-brand/10 text-brand [&_svg]:size-5">{icon}</div>
        <div>
          <p className="text-muted-foreground text-xs">{label}</p>
          <p className="font-display text-2xl">{value}</p>
          <p className="text-muted-foreground text-xs">{hint}</p>
        </div>
      </CardPanel>
    </Card>
  );
}

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}
