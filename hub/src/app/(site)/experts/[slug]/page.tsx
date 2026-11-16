import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BookOpen, ExternalLink, FileText, Flag, ListChecks, Lock, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Lozenge } from "@/components/brand/lozenge";
import { ExpertAvatar } from "@/components/site/expert-avatar";
import { profileTile } from "@/components/site/profile-card";
import { VerifiedBadge } from "@/components/site/verified-badge";
import { getExpertBySlug, listProfilesForExpert, listSources } from "@/lib/data";
import { bulletCount, frameworkNames } from "@/lib/frameworks";
import { cn } from "@/lib/utils";

export async function generateMetadata({ params }: PageProps<"/experts/[slug]">): Promise<Metadata> {
  const expert = await getExpertBySlug((await params).slug);
  return expert ? { title: expert.name, description: expert.headline } : {};
}

export default async function ExpertPage({ params }: PageProps<"/experts/[slug]">) {
  const { slug } = await params;
  const expert = await getExpertBySlug(slug);
  if (!expert) notFound();
  const profiles = (await listProfilesForExpert(expert.id)).filter((p) => p.status === "published");
  if (!profiles.length) notFound();
  const sources = await Promise.all(profiles.map((p) => listSources(p.id)));
  const firstName = expert.name.split(" ")[0];

  return (
    <div>
      {/* Cover */}
      <div className="relative h-36 overflow-hidden border-b bg-gradient-to-r from-brand/15 via-ctx-expert/10 to-ctx-team/10">
        <div className="bg-dots absolute inset-0 opacity-60" />
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="-mt-12 flex flex-col gap-5 pb-8 md:flex-row md:items-end">
          <ExpertAvatar expert={expert} className="size-24 rounded-2xl text-2xl ring-4 ring-background" />
          <div className="flex-1 space-y-2">
            <nav className="text-muted-foreground text-sm">
              <Link href="/experts" className="hover:text-foreground">
                Marketplace
              </Link>{" "}
              / <span className="text-foreground">{expert.name}</span>
            </nav>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-4xl">{expert.name}</h1>
              <VerifiedBadge verified={expert.verified} kind={expert.kind} />
            </div>
            <p className="max-w-2xl text-lg text-muted-foreground">{expert.headline}</p>
          </div>
          <Button size="lg" render={<Link href="/install" />}>
            Use in Confluence
            <ArrowRight aria-hidden />
          </Button>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-8 border-t px-4 py-10 sm:px-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {profiles.map((p) => (
              <a key={p.id} href={`#${p.id}`} className="rounded-full border px-3 py-1 text-sm hover:bg-accent">
                {p.title}
              </a>
            ))}
          </div>
          {profiles.map((profile, i) => {
            const frameworks = frameworkNames(profile.frameworks);
            const indexed = sources[i].filter((s) => s.status === "indexed");
            return (
              <article key={profile.id} id={profile.id} className="scroll-mt-24 overflow-hidden rounded-xl border bg-card">
                <header className="flex items-start gap-4 border-b p-6">
                  <div className={cn("flex size-12 shrink-0 items-center justify-center rounded-xl font-display text-xl", profileTile(profile.id))}>
                    {profile.title[0]}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-2xl">{profile.title}</h2>
                      <Lozenge appearance="success">Available in Rovo</Lozenge>
                    </div>
                    <p className="text-muted-foreground">{profile.tagline}</p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {profile.topics.slice(0, 8).map((t) => (
                        <Link key={t} href={`/experts?topic=${encodeURIComponent(t)}`} className="rounded-[3px] bg-navy/6 px-1.5 py-0.5 text-xs hover:bg-navy/10">
                          {t}
                        </Link>
                      ))}
                    </div>
                  </div>
                </header>
                <div className="grid gap-px bg-border sm:grid-cols-2">
                  <Block icon={<BookOpen aria-hidden />} title="Frameworks" count={frameworks.length}>
                    {frameworks.length ? <List items={frameworks} /> : <Muted>None listed yet</Muted>}
                  </Block>
                  <Block icon={<ListChecks aria-hidden />} title="Playbooks" count={profile.playbooks.length}>
                    {profile.playbooks.length ? (
                      <ul className="space-y-2">
                        {profile.playbooks.map((p) => (
                          <li key={p.id} className="text-sm">
                            {p.name}
                            {p.whenToUse ? <span className="block text-muted-foreground text-xs">{p.whenToUse}</span> : null}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <Muted>None yet</Muted>
                    )}
                  </Block>
                  <Block icon={<ScrollText aria-hidden />} title="Rules and red flags">
                    <p className="text-sm">
                      <span className="font-display text-xl">{bulletCount(profile.rules)}</span> <span className="text-muted-foreground">rules</span>
                      <span className="mx-2 text-muted-foreground">·</span>
                      <span className="font-display text-xl">{bulletCount(profile.redFlags) || frameworkNames(profile.redFlags).length}</span>{" "}
                      <span className="text-muted-foreground">red flags</span>
                    </p>
                  </Block>
                  <Block icon={<FileText aria-hidden />} title="Sources" count={indexed.length}>
                    {indexed.length ? <List items={indexed.slice(0, 6).map((s) => s.title)} /> : <Muted>Structured knowledge only</Muted>}
                  </Block>
                </div>
                <footer className="flex items-center gap-2 border-t bg-surface-sunken px-6 py-3 text-muted-foreground text-xs">
                  <Lock className="size-3.5 shrink-0" aria-hidden />
                  The full frameworks, rules and examples reach teams through the ExpertCTX agent, one question at a time.
                </footer>
              </article>
            );
          })}
        </div>

        <aside className="space-y-4">
          <div className="space-y-3 rounded-xl border bg-card p-5">
            <h2 className="font-semibold">About</h2>
            <p className="whitespace-pre-line text-muted-foreground text-sm">{expert.bio || "No bio yet."}</p>
            {expert.links.length ? (
              <div className="space-y-1.5 border-t pt-3">
                {expert.links.map((link) => (
                  <a key={link.url} href={link.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-brand text-sm hover:underline">
                    {link.label}
                    <ExternalLink className="size-3.5" aria-hidden />
                  </a>
                ))}
              </div>
            ) : null}
          </div>
          <div className="space-y-4 rounded-xl border bg-brand-soft/50 p-5">
            <h2 className="flex items-center gap-2 font-semibold">
              <Flag className="size-4 text-brand" aria-hidden />
              Ask {firstName} in Rovo
            </h2>
            <ol className="space-y-3 text-sm">
              <Step n={1}>Install ExpertCTX on your Confluence site.</Step>
              <Step n={2}>Open the page with your plan.</Step>
              <Step n={3}>
                Ask the ExpertCTX agent:{" "}
                <span className="font-medium">&ldquo;Review this page with {firstName}&apos;s {profiles[0].title} profile.&rdquo;</span>
              </Step>
            </ol>
            <Button className="w-full" render={<Link href="/install" />}>
              Get the app
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Block({ icon, title, count, children }: { icon: React.ReactNode; title: string; count?: number; children: React.ReactNode }) {
  return (
    <div className="space-y-3 bg-card p-6">
      <h3 className="flex items-center gap-2 font-semibold text-sm [&_svg]:size-4 [&_svg]:text-brand">
        {icon}
        {title}
        {count !== undefined ? <span className="font-normal text-muted-foreground text-xs">{count}</span> : null}
      </h3>
      {children}
    </div>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 text-sm">
          <span className="mt-2 size-1 shrink-0 rounded-full bg-muted-foreground/60" />
          {item}
        </li>
      ))}
    </ul>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-brand font-semibold text-[11px] text-brand-foreground">{n}</span>
      <span className="text-muted-foreground">{children}</span>
    </li>
  );
}

function Muted({ children }: { children: React.ReactNode }) {
  return <p className="text-muted-foreground text-sm">{children}</p>;
}
