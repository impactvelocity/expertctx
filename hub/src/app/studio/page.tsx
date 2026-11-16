import type { Metadata } from "next";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { Activity, ArrowRight, Check, Eye, FileText, Globe2, Layers, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardPanel, CardTitle } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Progress } from "@/components/ui/progress";
import { Lozenge } from "@/components/brand/lozenge";
import { LogoMark } from "@/components/site/logo";
import { ExpertAvatar } from "@/components/site/expert-avatar";
import { VerifiedBadge } from "@/components/site/verified-badge";
import { ClaimButton } from "@/components/studio/claim-button";
import { ExpertForm } from "@/components/studio/expert-form";
import { NewProfileDialog } from "@/components/studio/new-profile-dialog";
import { PageHeader } from "@/components/studio/page-header";
import { isAdmin, requireUserId } from "@/lib/auth";
import { countSources, getExpertByOwner, getUsage, listExperts, listProfilesForExpert } from "@/lib/data";
import { frameworkNames } from "@/lib/frameworks";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Studio" };

export default async function StudioPage() {
  const userId = await requireUserId();
  const expert = await getExpertByOwner(userId);

  if (!expert) {
    const [user, admin] = await Promise.all([currentUser(), isAdmin()]);
    const unclaimed = admin ? (await listExperts()).filter((e) => !e.ownerUserId) : [];
    return (
      <div className="mx-auto max-w-xl space-y-8 py-6">
        <div className="space-y-4 text-center">
          <LogoMark className="mx-auto size-12" />
          <div className="space-y-2">
            <h1 className="font-display text-4xl">Set up your expert profile</h1>
            <p className="text-muted-foreground">
              This is how teams see you in the marketplace and in Rovo answers. You&apos;ll add your frameworks and
              playbooks next.
            </p>
          </div>
        </div>
        {unclaimed.length ? (
          <Card className="border-brand/30">
            <CardHeader>
              <CardTitle>Seeded experts waiting for an owner</CardTitle>
              <CardDescription>You&apos;re an admin, so you can take one over instead of starting fresh.</CardDescription>
            </CardHeader>
            <CardPanel className="space-y-2">
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
  const totalSites = Object.values(usage).reduce((n, u) => Math.max(n, u.sites), 0);
  const totalSources = Object.values(sourceCounts).reduce((a, b) => a + b, 0);
  const published = profiles.filter((p) => p.status === "published");
  const firstName = expert.name.split(" ")[0];

  const steps = [
    { done: Boolean(expert.bio && expert.headline), label: "Write your headline and bio", href: "/studio/expert" },
    { done: Boolean(expert.avatarPath), label: "Add a photo", href: "/studio/expert" },
    { done: profiles.some((p) => frameworkNames(p.frameworks).length > 0), label: "Add your frameworks", href: profiles[0] ? `/studio/profiles/${profiles[0].id}?tab=knowledge` : null },
    { done: profiles.some((p) => p.playbooks.length > 0), label: "Write a playbook", href: profiles[0] ? `/studio/profiles/${profiles[0].id}?tab=playbooks` : null },
    { done: totalSources > 0, label: "Add a source: a talk, post or PDF", href: profiles[0] ? `/studio/profiles/${profiles[0].id}?tab=sources` : null },
    { done: published.length > 0, label: "Publish a profile", href: profiles[0] ? `/studio/profiles/${profiles[0].id}` : null },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <div className="space-y-8">
      <PageHeader
        crumbs={[{ label: "Studio" }]}
        title={`Welcome back, ${firstName}`}
        meta={<VerifiedBadge verified={expert.verified} kind={expert.kind} />}
        description={expert.headline}
        actions={
          <>
            {published.length ? (
              <Button variant="outline" render={<Link href={`/experts/${expert.slug}`} />}>
                <Eye aria-hidden />
                Public page
              </Button>
            ) : null}
            <NewProfileDialog />
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={<Layers aria-hidden />} tone="brand" label="Profiles" value={profiles.length} hint={`${published.length} published`} />
        <Stat icon={<FileText aria-hidden />} tone="team" label="Sources" value={totalSources} hint="Searched by meaning" />
        <Stat icon={<Activity aria-hidden />} tone="expert" label="Agent calls" value={totalCalls} hint="This month, from Rovo" />
        <Stat icon={<Globe2 aria-hidden />} tone="goal" label="Sites" value={totalSites} hint="Using you this month" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Your profiles</h2>
            <span className="text-muted-foreground text-xs">One for each job you&apos;re great at</span>
          </div>
          {profiles.length ? (
            <div className="divide-y overflow-hidden rounded-xl border bg-card">
              {profiles.map((profile) => (
                <Link
                  key={profile.id}
                  href={`/studio/profiles/${profile.id}`}
                  className="group flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-accent/60"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 font-display text-brand">
                    {profile.title[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium">{profile.title}</p>
                      {profile.status === "published" ? (
                        <Lozenge appearance="success">Published</Lozenge>
                      ) : (
                        <Lozenge>Draft</Lozenge>
                      )}
                    </div>
                    <p className="truncate text-muted-foreground text-sm">{profile.tagline || "No tagline yet"}</p>
                  </div>
                  <dl className="hidden shrink-0 grid-cols-3 gap-6 text-right text-xs sm:grid">
                    <Metric label="Frameworks" value={frameworkNames(profile.frameworks).length} />
                    <Metric label="Sources" value={sourceCounts[profile.id] ?? 0} />
                    <Metric label="Calls" value={usage[profile.id]?.calls ?? 0} />
                  </dl>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
                </Link>
              ))}
            </div>
          ) : (
            <Empty className="rounded-xl border border-dashed py-14">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Layers aria-hidden />
                </EmptyMedia>
                <EmptyTitle>Create your first profile</EmptyTitle>
                <EmptyDescription>
                  A profile is one job you&apos;re great at, like Launch or Product design.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <NewProfileDialog />
              </EmptyContent>
            </Empty>
          )}
        </section>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Getting started</CardTitle>
              <CardDescription>
                {doneCount} of {steps.length} done
              </CardDescription>
            </CardHeader>
            <CardPanel className="space-y-4">
              <Progress value={(doneCount / steps.length) * 100} />
              <ol className="space-y-1">
                {steps.map((step) => {
                  const body = (
                    <>
                      <span
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded-full border",
                          step.done ? "border-success bg-success text-white" : "border-input",
                        )}
                      >
                        {step.done ? <Check className="size-3" aria-hidden /> : null}
                      </span>
                      <span className={cn(step.done && "text-muted-foreground line-through decoration-muted-foreground/40")}>
                        {step.label}
                      </span>
                    </>
                  );
                  return (
                    <li key={step.label}>
                      {step.href && !step.done ? (
                        <Link href={step.href} className="flex items-center gap-2.5 rounded-md px-1.5 py-1.5 text-sm hover:bg-accent">
                          {body}
                        </Link>
                      ) : (
                        <div className="flex items-center gap-2.5 px-1.5 py-1.5 text-sm">{body}</div>
                      )}
                    </li>
                  );
                })}
              </ol>
            </CardPanel>
          </Card>
          <Card className="bg-brand-soft/50">
            <CardPanel className="space-y-2 p-5">
              <p className="font-medium text-sm">Try yourself in Rovo</p>
              <p className="text-muted-foreground text-sm">
                Install the app on a Confluence site, open a plan and ask: &ldquo;Review this page with {firstName}&apos;s{" "}
                {profiles[0]?.title ?? "Launch"} profile.&rdquo;
              </p>
              <Button variant="outline" size="sm" render={<Link href="/install" />}>
                <Pencil aria-hidden />
                Install steps
              </Button>
            </CardPanel>
          </Card>
        </aside>
      </div>
    </div>
  );
}

const TONES = {
  brand: "bg-brand/10 text-brand",
  team: "bg-ctx-team/12 text-ctx-team",
  goal: "bg-ctx-goal/18 text-warning-foreground",
  expert: "bg-ctx-expert/12 text-ctx-expert",
} as const;

function Stat({
  icon,
  tone,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  tone: keyof typeof TONES;
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-xs">{label}</p>
        <div className={cn("flex size-7 items-center justify-center rounded-md [&_svg]:size-3.5", TONES[tone])}>{icon}</div>
      </div>
      <p className="mt-1 font-display text-3xl">{value}</p>
      <p className="text-muted-foreground text-xs">{hint}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-sm">{value}</dd>
    </div>
  );
}
