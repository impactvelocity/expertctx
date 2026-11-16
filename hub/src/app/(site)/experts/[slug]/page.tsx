import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BookOpen, ExternalLink, FileText, Flag, ListChecks, Lock, ScrollText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardPanel } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ExpertAvatar } from "@/components/site/expert-avatar";
import { VerifiedBadge } from "@/components/site/verified-badge";
import { getExpertBySlug, listProfilesForExpert, listSources } from "@/lib/data";
import { bulletCount, frameworkNames } from "@/lib/frameworks";

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

  return (
    <div>
      <section className="border-b bg-muted/40">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-14 sm:px-6 md:flex-row md:items-end">
          <ExpertAvatar expert={expert} className="size-20 text-2xl" />
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-4xl sm:text-5xl">{expert.name}</h1>
              <VerifiedBadge verified={expert.verified} kind={expert.kind} />
            </div>
            <p className="max-w-2xl text-lg text-muted-foreground">{expert.headline}</p>
            {expert.links.length ? (
              <div className="flex flex-wrap gap-3 text-sm">
                {expert.links.map((link) => (
                  <a key={link.url} href={link.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
                    {link.label}
                    <ExternalLink className="size-3.5" aria-hidden />
                  </a>
                ))}
              </div>
            ) : null}
          </div>
          <Button size="lg" render={<Link href={`/install?expert=${profiles[0].id}`} />}>
            Use in Confluence
            <ArrowRight aria-hidden />
          </Button>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-8">
          {profiles.map((profile, i) => {
            const frameworks = frameworkNames(profile.frameworks);
            return (
              <Card key={profile.id} id={profile.id} className="scroll-mt-24">
                <CardPanel className="space-y-6 p-6 sm:p-8">
                  <div className="space-y-2">
                    <p className="text-muted-foreground text-xs uppercase tracking-wide">Profile</p>
                    <h2 className="font-display text-3xl">{profile.title}</h2>
                    <p className="text-muted-foreground">{profile.tagline}</p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {profile.topics.map((t) => (
                        <Badge key={t} variant="secondary">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Separator />
                  <div className="grid gap-6 sm:grid-cols-2">
                    <Block icon={<BookOpen aria-hidden />} title="Frameworks">
                      {frameworks.length ? (
                        <ul className="space-y-1.5">
                          {frameworks.map((f) => (
                            <li key={f} className="text-sm">{f}</li>
                          ))}
                        </ul>
                      ) : (
                        <Muted>None listed yet</Muted>
                      )}
                    </Block>
                    <Block icon={<ListChecks aria-hidden />} title="Playbooks">
                      {profile.playbooks.length ? (
                        <ul className="space-y-1.5">
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
                        {bulletCount(profile.rules)} rules · {bulletCount(profile.redFlags) || frameworkNames(profile.redFlags).length} red flags
                      </p>
                    </Block>
                    <Block icon={<FileText aria-hidden />} title="Sources">
                      {sources[i].filter((s) => s.status === "indexed").length ? (
                        <ul className="space-y-1.5">
                          {sources[i]
                            .filter((s) => s.status === "indexed")
                            .slice(0, 6)
                            .map((s) => (
                              <li key={s.id} className="truncate text-sm">{s.title}</li>
                            ))}
                        </ul>
                      ) : (
                        <Muted>Structured knowledge only</Muted>
                      )}
                    </Block>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-muted-foreground text-xs">
                    <Lock className="size-3.5 shrink-0" aria-hidden />
                    The full frameworks, rules and examples are available to teams through the ExpertCTX app in Rovo.
                  </div>
                </CardPanel>
              </Card>
            );
          })}
        </div>

        <aside className="space-y-6">
          <Card>
            <CardPanel className="space-y-3 p-6">
              <h2 className="font-medium">About</h2>
              <p className="whitespace-pre-line text-muted-foreground text-sm">{expert.bio || "No bio yet."}</p>
            </CardPanel>
          </Card>
          <Card>
            <CardPanel className="space-y-3 p-6">
              <h2 className="font-medium">Ask in Rovo</h2>
              <ol className="space-y-2 text-muted-foreground text-sm">
                <li>1. Install ExpertCTX in Confluence.</li>
                <li>2. Open the page with your plan.</li>
                <li>
                  3. Ask the ExpertCTX agent: <span className="text-foreground">&ldquo;Review this page with {expert.name.split(" ")[0]}&apos;s {profiles[0].title} profile.&rdquo;</span>
                </li>
              </ol>
              <Button variant="outline" className="w-full" render={<Link href="/install" />}>
                <Flag aria-hidden />
                Install steps
              </Button>
            </CardPanel>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Block({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="flex items-center gap-2 font-medium text-sm [&_svg]:size-4 [&_svg]:text-brand">
        {icon}
        {title}
      </h3>
      {children}
    </div>
  );
}

function Muted({ children }: { children: React.ReactNode }) {
  return <p className="text-muted-foreground text-sm">{children}</p>;
}
