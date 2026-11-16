import type { Metadata } from "next";
import Link from "next/link";
import { Search, SearchX, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { ProfileCard } from "@/components/site/profile-card";
import { listPublishedProfiles } from "@/lib/data";
import { searchProfiles } from "@/lib/knowledge";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Expert marketplace" };

export default async function ExpertsPage({ searchParams }: PageProps<"/experts">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const topic = typeof params.topic === "string" ? params.topic : "";

  const [all, results] = await Promise.all([listPublishedProfiles(), searchProfiles(q, topic || undefined)]);
  const topicCounts = new Map<string, number>();
  for (const profile of all) for (const t of profile.topics) topicCounts.set(t, (topicCounts.get(t) ?? 0) + 1);
  const topics = [...topicCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([t]) => t);
  const expertCount = new Set(all.map((p) => p.expertId)).size;

  const href = (next: { q?: string; topic?: string }) => {
    const sp = new URLSearchParams();
    if (next.q) sp.set("q", next.q);
    if (next.topic) sp.set("topic", next.topic);
    const s = sp.toString();
    return s ? `/experts?${s}` : "/experts";
  };

  return (
    <div>
      <section className="border-b bg-muted/40">
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-14 sm:px-6">
          <div className="space-y-3">
            <p className="font-medium text-brand text-sm">Marketplace</p>
            <h1 className="font-display text-5xl">Find an expert for what you&apos;re doing next.</h1>
            <p className="max-w-2xl text-lg text-muted-foreground">
              {all.length} profile{all.length === 1 ? "" : "s"} from {expertCount} expert{expertCount === 1 ? "" : "s"}. Add
              any of them to a Confluence space and ask for their view in Rovo.
            </p>
          </div>
          <form action="/experts" className="flex max-w-2xl gap-2">
            {topic ? <input type="hidden" name="topic" value={topic} /> : null}
            <InputGroup className="flex-1">
              <InputGroupAddon>
                <Search aria-hidden />
              </InputGroupAddon>
              <InputGroupInput
                name="q"
                defaultValue={q}
                placeholder="Try “pricing a new product” or “first launch”"
                aria-label="Search experts"
              />
            </InputGroup>
            <Button type="submit" size="lg">
              Search
            </Button>
          </form>
          {topics.length ? (
            <div className="flex flex-wrap gap-2">
              <TopicChip href={href({ q })} active={!topic}>
                All
              </TopicChip>
              {topics.map((t) => (
                <TopicChip key={t} href={href({ q, topic: t })} active={topic === t}>
                  {t}
                </TopicChip>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        {q ? (
          <p className="mb-6 flex items-center gap-2 text-muted-foreground text-sm">
            <Sparkles className="size-4 text-brand" aria-hidden />
            {results.length} match{results.length === 1 ? "" : "es"} for &ldquo;{q}&rdquo;, ranked by meaning
          </p>
        ) : null}
        {results.length ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {results.map((profile) => (
              <ProfileCard key={profile.id} profile={profile} />
            ))}
          </div>
        ) : (
          <Empty className="rounded-2xl border border-dashed py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SearchX aria-hidden />
              </EmptyMedia>
              <EmptyTitle>No experts match yet</EmptyTitle>
              <EmptyDescription>
                Try a broader search, or <Link href="/studio" className="underline">publish your own profile</Link>.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </section>
    </div>
  );
}

function TopicChip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full border px-3 py-1 text-sm transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-accent",
      )}
    >
      {children}
    </Link>
  );
}
