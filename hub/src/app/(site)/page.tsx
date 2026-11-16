import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Bot,
  FileText,
  Flag,
  Layers,
  ListChecks,
  Lock,
  MessageSquareQuote,
  Store,
  Target,
  Upload,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardPanel } from "@/components/ui/card";
import { RovoMock } from "@/components/landing/rovo-mock";
import { ProfileCard } from "@/components/site/profile-card";
import { listPublishedProfiles } from "@/lib/data";

export const dynamic = "force-dynamic";


export default async function HomePage() {
  const featured = (await listPublishedProfiles().catch(() => [])).slice(0, 3);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div className="bg-grid absolute inset-0 -z-10 opacity-40 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_70%)]" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:py-28">
          <div className="space-y-7">
            <Badge variant="outline" size="lg" className="gap-1.5">
              <Bot aria-hidden />
              For Confluence and Rovo
            </Badge>
            <h1 className="font-display text-5xl leading-[1.02] sm:text-6xl">
              Bring an expert into your team&apos;s Atlassian.
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              Rovo knows your team. AI knows the world. <span className="text-foreground">ExpertCTX brings the expert:</span>{" "}
              the frameworks, rules and red flags of someone who has done this twenty times, applied to your own pages.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="xl" render={<Link href="/experts" />}>
                Browse experts
                <ArrowRight aria-hidden />
              </Button>
              <Button size="xl" variant="outline" render={<Link href="/studio" />}>
                Become an expert
              </Button>
            </div>
            <p className="text-muted-foreground text-sm">Free while in beta. Installs in Confluence in a minute.</p>
          </div>
          <RovoMock />
        </div>
      </section>

      {/* Three contexts */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="max-w-2xl space-y-3">
          <p className="font-medium text-brand text-sm">Three kinds of context</p>
          <h2 className="font-display text-4xl">Your team has the docs. It doesn&apos;t have someone who&apos;s done it before.</h2>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <ContextCard
            icon={<Users aria-hidden />}
            title="Team"
            source="Confluence pages, authors, owners"
            body="What your team has written, decided and owns. ExpertCTX reads it in place, as you."
          />
          <ContextCard
            icon={<Target aria-hidden />}
            title="Goal"
            source="The page you're on"
            body="The launch, redesign or funnel you're working towards, and the plan you've drafted for it."
          />
          <ContextCard
            highlight
            icon={<MessageSquareQuote aria-hidden />}
            title="Expert"
            source="Published on ExpertCTX"
            body="How an expert thinks: named frameworks, non-negotiable rules, red flags, playbooks and their own sources."
          />
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-20 border-y bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="max-w-2xl space-y-3">
            <p className="font-medium text-brand text-sm">How it works</p>
            <h2 className="font-display text-4xl">From an expert&apos;s head to your team&apos;s plan page.</h2>
          </div>
          <ol className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Step n={1} icon={<Upload aria-hidden />} title="Experts publish once">
              Frameworks, rules, red flags, playbooks and source material, on the hub.
            </Step>
            <Step n={2} icon={<Store aria-hidden />} title="Teams install the app">
              One install puts the ExpertCTX agent in Rovo and an expert directory in Confluence.
            </Step>
            <Step n={3} icon={<Bot aria-hidden />} title="Ask on your own page">
              &ldquo;Review this with the Launch expert.&rdquo; Answers cite your pages and the expert&apos;s methods.
            </Step>
            <Step n={4} icon={<ListChecks aria-hidden />} title="Turn it into work">
              The agent writes a plan page with tasks assigned to the people who know each area.
            </Step>
          </ol>
        </div>
      </section>

      {/* Featured experts */}
      {featured.length ? (
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-3">
              <p className="font-medium text-brand text-sm">In the marketplace</p>
              <h2 className="font-display text-4xl">Experts you can add today</h2>
            </div>
            <Button variant="outline" render={<Link href="/experts" />}>
              See all experts
              <ArrowRight aria-hidden />
            </Button>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {featured.map((profile) => (
              <ProfileCard key={profile.id} profile={profile} />
            ))}
          </div>
        </section>
      ) : null}

      {/* For experts */}
      <section id="for-experts" className="scroll-mt-20 border-t">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2">
          <div className="space-y-6">
            <p className="font-medium text-brand text-sm">For experts</p>
            <h2 className="font-display text-4xl">Your method, working where the work happens.</h2>
            <p className="text-lg text-muted-foreground">
              You sell your judgment one call or one course at a time. On ExpertCTX it lives inside the tools teams
              already use, stays tied to your name, and every answer credits you.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" render={<Link href="/studio" />}>
                Create your expert profile
              </Button>
              <Button size="lg" variant="ghost" render={<Link href="/experts" />}>
                See examples
              </Button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Feature icon={<BookOpen aria-hidden />} title="Frameworks">
              Named methods with steps, cited by name in every answer.
            </Feature>
            <Feature icon={<Flag aria-hidden />} title="Rules and red flags">
              Your non-negotiables, and the patterns you spot before they cost a quarter.
            </Feature>
            <Feature icon={<ListChecks aria-hidden />} title="Playbooks">
              Reviews and checklists the agent runs step by step on a team&apos;s plan.
            </Feature>
            <Feature icon={<FileText aria-hidden />} title="Sources">
              PDFs, posts and notes, searched by meaning and quoted with citations.
            </Feature>
            <Feature icon={<Layers aria-hidden />} title="Several profiles">
              One for each job you&apos;re great at: Launch, Product design, Funnels.
            </Feature>
            <Feature icon={<Lock aria-hidden />} title="Your IP, protected">
              The public page shows names and summaries. The full knowledge only goes to agents.
            </Feature>
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section className="border-t bg-muted/40">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-14 sm:px-6 md:flex-row md:items-center">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <Lock className="size-5" aria-hidden />
          </div>
          <div className="flex-1 space-y-1">
            <h2 className="font-display text-2xl">Your pages never leave Atlassian.</h2>
            <p className="text-muted-foreground">
              The app sends the hub only the question and the expert&apos;s name. Rovo combines the expert&apos;s
              knowledge with your pages inside your own site.
            </p>
          </div>
          <Button variant="outline" render={<Link href="/install#privacy" />}>
            What data moves
          </Button>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-24 text-center sm:px-6">
        <h2 className="mx-auto max-w-2xl font-display text-5xl">Give your next launch someone who&apos;s done it before.</h2>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button size="xl" render={<Link href="/install" />}>
            Add to Confluence
          </Button>
          <Button size="xl" variant="outline" render={<Link href="/experts" />}>
            Browse experts
          </Button>
        </div>
      </section>
    </>
  );
}

function ContextCard({
  icon,
  title,
  source,
  body,
  highlight,
}: {
  icon: React.ReactNode;
  title: string;
  source: string;
  body: string;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? "border-brand/40 bg-brand-soft/60" : undefined}>
      <CardPanel className="space-y-4 p-6">
        <div
          className={
            highlight
              ? "flex size-10 items-center justify-center rounded-xl bg-brand text-brand-foreground [&_svg]:size-5"
              : "flex size-10 items-center justify-center rounded-xl bg-muted [&_svg]:size-5"
          }
        >
          {icon}
        </div>
        <div className="space-y-1">
          <h3 className="font-display text-2xl">{title}</h3>
          <p className="text-muted-foreground text-xs uppercase tracking-wide">{source}</p>
        </div>
        <p className="text-muted-foreground">{body}</p>
      </CardPanel>
    </Card>
  );
}

function Step({ n, icon, title, children }: { n: number; icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <li>
      <Card className="h-full">
        <CardPanel className="space-y-3 p-6">
          <div className="flex items-center justify-between">
            <div className="flex size-9 items-center justify-center rounded-lg bg-background shadow-xs ring-1 ring-border [&_svg]:size-4">
              {icon}
            </div>
            <span className="font-display text-3xl text-muted-foreground/40">{n}</span>
          </div>
          <h3 className="font-medium">{title}</h3>
          <p className="text-muted-foreground text-sm">{children}</p>
        </CardPanel>
      </Card>
    </li>
  );
}

function Feature({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2 rounded-xl border p-4">
      <div className="flex items-center gap-2 font-medium [&_svg]:size-4 [&_svg]:text-brand">
        {icon}
        {title}
      </div>
      <p className="text-muted-foreground text-sm">{children}</p>
    </div>
  );
}
