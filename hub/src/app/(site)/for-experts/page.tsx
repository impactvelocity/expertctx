import type { Metadata } from "next";
import Link from "next/link";
import { Activity, ArrowRight, BookOpen, Check, Eye, FileText, Flag, Layers, ListChecks, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Lozenge } from "@/components/brand/lozenge";
import { PlaybookMock } from "@/components/landing/feature-mocks";
import { Section, SectionHeading } from "@/components/site/section";

export const metadata: Metadata = {
  title: "For experts",
  description: "Publish your frameworks, rules and playbooks once. Teams apply them inside Confluence and Rovo, with your name on every answer.",
};

export default function ForExpertsPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b">
        <div className="bg-dots absolute inset-0 -z-10 opacity-70 [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_65%)]" />
        <div className="mx-auto max-w-4xl space-y-7 px-4 py-20 text-center sm:px-6 lg:py-28">
          <Lozenge appearance="new" className="mx-auto">For experts</Lozenge>
          <h1 className="font-display text-5xl leading-[1.04] sm:text-6xl">
            Your method, working where the work <span className="text-ctx-expert">actually happens</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            You sell your judgment one call or one course at a time. On ExpertCTX it lives inside the tools teams already
            use, stays tied to your name, and every answer credits you.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button size="xl" render={<Link href="/studio" />}>
              Create your expert profile
            </Button>
            <Button size="xl" variant="outline" render={<Link href="/experts/dylan-jones" />}>
              See an example
              <ArrowRight aria-hidden />
            </Button>
          </div>
        </div>
      </section>

      <Section>
        <SectionHeading eyebrow="What you add" title="Structured, so an agent can use it the way you would" />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Feature icon={<BookOpen aria-hidden />} title="Frameworks">
            Your named methods, with steps. Answers cite them by name: &ldquo;Dylan&apos;s <em>Warm-up, open, close</em>&rdquo;.
          </Feature>
          <Feature icon={<Flag aria-hidden />} title="Rules and red flags">
            Your non-negotiables, and the patterns you spot before they cost a team a quarter.
          </Feature>
          <Feature icon={<ListChecks aria-hidden />} title="Playbooks">
            How you review a plan, step by step. The agent runs them in order and answers in your format.
          </Feature>
          <Feature icon={<FileText aria-hidden />} title="Sources">
            Talks, posts, notes and PDFs. Searched by meaning, quoted with citations to the page or heading.
          </Feature>
          <Feature icon={<Layers aria-hidden />} title="Several profiles">
            One for each job you&apos;re great at. Teams pick the one that fits the page they&apos;re on.
          </Feature>
          <Feature icon={<Eye aria-hidden />} title="Preview">
            See exactly what the agent receives for any question before you publish.
          </Feature>
        </div>
      </Section>

      <section className="border-y bg-surface-sunken">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2">
          <div className="space-y-5">
            <SectionHeading
              eyebrow="Playbooks"
              title="Write down how you'd review it. The agent does it that way."
              description="A playbook is the checklist in your head: what to look at first, what to flag, what the answer should look like."
            />
          </div>
          <PlaybookMock />
        </div>
      </section>

      <Section>
        <div className="grid gap-6 md:grid-cols-3">
          <PromiseItem icon={<Lock aria-hidden />} title="Your IP stays yours">
            Public pages show names and summaries. The full knowledge only goes to agents, one question at a time.
          </PromiseItem>
          <PromiseItem icon={<Activity aria-hidden />} title="See where you're used">
            Agent calls and sites, per profile, every month.
          </PromiseItem>
          <PromiseItem icon={<Check aria-hidden />} title="Verified, not impersonated">
            New experts start unverified. Nobody can publish a persona of a real person without them.
          </PromiseItem>
        </div>
      </Section>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
        <div className="relative overflow-hidden rounded-2xl bg-navy px-8 py-14 text-center text-white">
          <div className="bg-dots absolute inset-0 opacity-10" />
          <div className="relative space-y-5">
            <h2 className="font-display text-4xl">Set up your profile in ten minutes</h2>
            <p className="mx-auto max-w-xl text-white/70">Start with one profile and three frameworks. Add playbooks and sources when you&apos;re ready.</p>
            <Button size="xl" className="bg-white text-navy hover:bg-white/90" render={<Link href="/studio" />}>
              Get started, it&apos;s free
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

function Feature({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2 rounded-xl border bg-card p-5">
      <div className="flex size-9 items-center justify-center rounded-lg bg-ctx-expert/12 text-ctx-expert [&_svg]:size-4">{icon}</div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-muted-foreground text-sm">{children}</p>
    </div>
  );
}

function PromiseItem({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 font-semibold [&_svg]:size-4 [&_svg]:text-brand">
        {icon}
        {title}
      </div>
      <p className="text-muted-foreground text-sm">{children}</p>
    </div>
  );
}
