import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Search, SearchX, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { ProfileCard } from "@/components/site/profile-card";
import { listPublishedProfiles } from "@/lib/data";
import { searchProfiles } from "@/lib/knowledge";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Marketplace" };

const SUGGESTED = ["First launch", "Pricing a new product", "Onboarding redesign", "Landing page that converts"];

export default async function ExpertsPage({ searchParams }: PageProps<"/experts">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const topic = typeof params.topic === "string" ? params.topic : "";
  const verifiedOnly = params.verified === "1";

  const [all, found] = await Promise.all([listPublishedProfiles(), searchProfiles(q, topic || undefined)]);
  const results = verifiedOnly ? found.filter((p) => p.expert.verified) : found;
  const topicCounts = new Map<string, number>();
  for (const profile of all) for (const t of profile.topics) topicCounts.set(t, (topicCounts.get(t) ?? 0) + 1);
  const topics = [...topicCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 14);
  const expertCount = new Set(all.map((p) => p.expertId)).size;

  const href = (next: { q?: string; topic?: string; verified?: boolean }) => {
    const sp = new URLSearchParams();
    if (next.q) sp.set("q", next.q);
    if (next.topic) sp.set("topic", next.topic);
    if (next.verified) sp.set("verified", "1");
    const s = sp.toString();
    return s ? `/experts?${s}` : "/experts";
  };

  return (
    <div>
      <section className="relative overflow-hidden border-b bg-surface-sunken">
        <div className="bg-dots absolute inset-0 opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <div className="relative mx-auto max-w-7xl space-y-6 px-4 py-14 sm:px-6">
          <div className="max-w-2xl space-y-3">
            <p className="font-semibold text-brand text-xs uppercase tracking-[0.08em]">Marketplace</p>
            <h1 className="font-display text-5xl leading-[1.05]">Find an expert for what you&apos;re doing next</h1>
            <p className="text-lg text-muted-foreground">
              {all.length} profile{all.length === 1 ? "" : "s"} from {expertCount} expert{expertCount === 1 ? "" : "s"}. Add any
              of them to your Confluence site and ask for their view in Rovo.
            </p>
          </div>
          <form action="/experts" className="flex max-w-2xl gap-2">
            {topic ? <input type="hidden" name="topic" value={topic} /> : null}
            {verifiedOnly ? <input type="hidden" name="verified" value="1" /> : null}
            <InputGroup className="flex-1 bg-background">
              <InputGroupAddon>
                <Search aria-hidden />
              </InputGroupAddon>
              <InputGroupInput name="q" defaultValue={q} placeholder="Describe what you're working on" aria-label="Search experts" />
            </InputGroup>
            <Button type="submit" size="lg">
              Search
            </Button>
          </form>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">Try:</span>
            {SUGGESTED.map((s) => (
              <Link key={s} href={href({ q: s })} className="rounded-md px-1.5 py-0.5 text-brand hover:bg-brand/10">
                {s}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[220px_1fr]">
        <aside className="space-y-6">
          <FilterGroup title="Topics">
            <FilterLink href={href({ q, verified: verifiedOnly })} active={!topic}>
              All topics
            </FilterLink>
            {topics.map(([t, n]) => (
              <FilterLink key={t} href={href({ q, topic: t, verified: verifiedOnly })} active={topic === t} count={n}>
                {t[0].toUpperCase() + t.slice(1)}
              </FilterLink>
            ))}
          </FilterGroup>
          <FilterGroup title="Trust">
            <FilterLink href={href({ q, topic, verified: !verifiedOnly })} active={verifiedOnly}>
              <BadgeCheck className="size-4" aria-hidden />
              Verified experts only
            </FilterLink>
          </FilterGroup>
          <div className="rounded-xl border bg-brand-soft/50 p-4">
            <p className="font-medium text-sm">Are you an expert?</p>
            <p className="mt-1 text-muted-foreground text-xs">Publish your frameworks and playbooks. Teams can use them tomorrow.</p>
            <Button size="sm" variant="outline" className="mt-3 w-full" render={<Link href="/for-experts" />}>
              Learn more
            </Button>
          </div>
        </aside>

        <section className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <p className="text-muted-foreground">
              {q ? (
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles className="size-4 text-brand" aria-hidden />
                  {results.length} match{results.length === 1 ? "" : "es"} for <span className="text-foreground">&ldquo;{q}&rdquo;</span>,
                  ranked by meaning
                </span>
              ) : (
                <>
                  {results.length} profile{results.length === 1 ? "" : "s"}
                  {topic ? (
                    <>
                      {" "}
                      in <span className="text-foreground">{topic}</span>
                    </>
                  ) : null}
                </>
              )}
            </p>
            {q || topic || verifiedOnly ? (
              <Link href="/experts" className="text-brand hover:underline">
                Clear filters
              </Link>
            ) : null}
          </div>
          {results.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {results.map((profile) => (
                <ProfileCard key={profile.id} profile={profile} />
              ))}
            </div>
          ) : (
            <Empty className="rounded-xl border border-dashed py-16">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <SearchX aria-hidden />
                </EmptyMedia>
                <EmptyTitle>No experts match yet</EmptyTitle>
                <EmptyDescription>
                  Try a broader search, or{" "}
                  <Link href="/for-experts" className="text-brand underline">
                    publish your own profile
                  </Link>
                  .
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </section>
      </div>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="px-2 font-semibold text-muted-foreground text-xs uppercase tracking-wide">{title}</p>
      <nav className="space-y-0.5">{children}</nav>
    </div>
  );
}

function FilterLink({ href, active, count, children }: { href: string; active: boolean; count?: number; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex h-8 items-center gap-2 rounded-md px-2 text-sm transition-colors",
        active ? "bg-brand/10 font-medium text-brand" : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      <span className="flex min-w-0 flex-1 items-center gap-2 truncate">{children}</span>
      {count !== undefined ? <span className="text-xs tabular-nums opacity-70">{count}</span> : null}
    </Link>
  );
}
