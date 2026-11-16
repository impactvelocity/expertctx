import Link from "next/link";
import { ArrowRight, Bot, Check, ListChecks, Lock, Store, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Lozenge } from "@/components/brand/lozenge";
import { ContextsDiagram, PlanPageMock, PlaybookMock } from "@/components/landing/feature-mocks";
import { RovoMock } from "@/components/landing/rovo-mock";
import { Section, SectionHeading } from "@/components/site/section";
import { ProfileCard } from "@/components/site/profile-card";
import { listPublishedProfiles } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const featured = (await listPublishedProfiles().catch(() => [])).slice(0, 3);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div className="bg-dots absolute inset-0 -z-10 opacity-70 [mask-image:radial-gradient(ellipse_at_top_left,black_20%,transparent_65%)]" />
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 pt-16 pb-20 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:pt-24 lg:pb-28">
          <div className="space-y-7">
            <Link href="/install" className="group inline-flex items-center gap-2 rounded-full border bg-background py-1 pr-3 pl-1 text-sm shadow-xs">
              <Lozenge appearance="new">New</Lozenge>
              <span className="text-muted-foreground">A Rovo agent for Confluence</span>
              <ArrowRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
            <h1 className="font-display text-5xl leading-[1.02] sm:text-6xl">
              The expert in the room, <span className="text-brand">on every page.</span>
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              Experts publish their frameworks, rules and playbooks once. Your team applies them to its own Confluence
              pages through Rovo, and gets reviews and plans that cite both.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="xl" render={<Link href="/install" />}>
                Get it for Confluence
              </Button>
              <Button size="xl" variant="outline" render={<Link href="/experts" />}>
                Browse experts
                <ArrowRight aria-hidden />
              </Button>
            </div>
            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-muted-foreground text-sm">
              {["Built on Atlassian Forge", "Team data stays in your site", "Free during beta"].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <Check className="size-4 text-success" aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <RovoMock />
        </div>
      </section>

      {/* Three contexts */}
      <Section>
        <SectionHeading
          eyebrow="Three kinds of context"
          title="Rovo knows your team. AI knows the world. ExpertCTX brings the expert."
          description="Your team has the docs and the people. What it's missing is someone who has done this twenty times. ExpertCTX puts their judgment next to your pages."
        />
        <div className="mt-12">
          <ContextsDiagram />
        </div>
      </Section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-20 border-y bg-surface-sunken">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <SectionHeading eyebrow="How it works" title="From an expert's head to your team's plan page" />
          <ol className="mt-12 grid gap-px overflow-hidden rounded-xl border bg-border md:grid-cols-2 lg:grid-cols-4">
            <Step n={1} icon={<Upload aria-hidden />} title="Experts publish once">
              Frameworks, rules, red flags, playbooks and their own source material, in the ExpertCTX studio.
            </Step>
            <Step n={2} icon={<Store aria-hidden />} title="Teams install the app">
              One install adds the ExpertCTX agent to Rovo and an expert directory to Confluence.
            </Step>
            <Step n={3} icon={<Bot aria-hidden />} title="Ask on your own page">
              &ldquo;Review this with the Launch expert.&rdquo; The agent reads the page and the people behind it.
            </Step>
            <Step n={4} icon={<ListChecks aria-hidden />} title="Turn it into work">
              It writes a plan page with tasks assigned to the teammates who know each area.
            </Step>
          </ol>
        </div>
      </section>

      {/* Feature: plans */}
      <Section>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="space-y-5">
            <SectionHeading
              eyebrow="Plans with owners"
              title="Advice that lands on the right desk"
              description="The agent knows who wrote, owns and edited each page. Every task goes to the person whose work supports it, with the reason written next to it."
            />
            <Bullets
              items={[
                "Real Confluence tasks, assigned with @mentions",
                "Each section names the framework it comes from",
                "Rovo asks before it creates anything",
              ]}
            />
          </div>
          <PlanPageMock />
        </div>
      </Section>

      {/* Feature: playbooks */}
      <Section className="pt-0">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <PlaybookMock />
          <div className="space-y-5 lg:order-first">
            <SectionHeading
              eyebrow="Playbooks"
              title="The way an expert reviews, run step by step"
              description="Experts write down how they check a launch, a funnel or an onboarding flow. The agent follows those steps on your plan, in order, and answers in the expert's format."
            />
            <Bullets
              items={[
                "Named, so answers say which playbook ran",
                "Grounded in the expert's own talks and posts",
                "Experts preview exactly what the agent receives",
              ]}
            />
          </div>
        </div>
      </Section>

      {/* Featured experts */}
      {featured.length ? (
        <section className="border-t bg-surface-sunken">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <SectionHeading eyebrow="Marketplace" title="Experts you can add today" />
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
          </div>
        </section>
      ) : null}

      {/* Privacy */}
      <Section>
        <div className="grid gap-8 rounded-2xl border p-8 md:grid-cols-[auto_1fr_auto] md:items-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-ctx-team/12 text-ctx-team">
            <Lock className="size-5" aria-hidden />
          </div>
          <div className="space-y-1">
            <h2 className="font-display text-2xl">Your pages never leave Atlassian</h2>
            <p className="text-muted-foreground">
              The app sends the hub only the question and the expert&apos;s name. Rovo combines the expert&apos;s
              knowledge with your pages inside your own site, as the signed-in user.
            </p>
          </div>
          <Button variant="outline" render={<Link href="/install#privacy" />}>
            What data moves
          </Button>
        </div>
      </Section>

      {/* CTA band */}
      <section className="relative overflow-hidden bg-brand text-brand-foreground">
        <div className="absolute inset-0 bg-gradient-to-br from-brand via-brand to-ctx-expert opacity-90" />
        <div className="bg-dots absolute inset-0 opacity-20" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 md:grid-cols-2 md:items-center">
          <div className="space-y-2">
            <h2 className="font-display text-4xl">Give your next launch someone who&apos;s done it before.</h2>
            <p className="text-brand-foreground/80">Install in a minute. Try it on a demo team in one click.</p>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <Button size="xl" variant="secondary" className="bg-white text-brand hover:bg-white/90" render={<Link href="/install" />}>
              Get it for Confluence
            </Button>
            <Button size="xl" variant="ghost" className="text-brand-foreground hover:bg-white/10" render={<Link href="/for-experts" />}>
              I&apos;m an expert
              <ArrowRight aria-hidden />
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

function Step({ n, icon, title, children }: { n: number; icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <li className="space-y-3 bg-card p-6">
      <div className="flex items-center justify-between">
        <div className="flex size-9 items-center justify-center rounded-lg bg-brand/10 text-brand [&_svg]:size-4">{icon}</div>
        <span className="font-display text-muted-foreground/40 text-sm">0{n}</span>
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-muted-foreground text-sm">{children}</p>
    </li>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5 text-sm">
          <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-success/15">
            <Check className="size-3 text-success-foreground" aria-hidden />
          </span>
          {item}
        </li>
      ))}
    </ul>
  );
}
