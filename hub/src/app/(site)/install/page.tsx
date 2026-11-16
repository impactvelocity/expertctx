import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Bot, Check, FileText, Globe, KeyRound, Lock, MessageSquare, Server, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardPanel } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LogoMark } from "@/components/site/logo";

export const metadata: Metadata = { title: "Install ExpertCTX for Confluence" };

const INSTALL_URL = process.env.NEXT_PUBLIC_FORGE_INSTALL_URL;

export default function InstallPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      {/* Listing header, styled like an app marketplace listing */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center">
        <div className="flex size-20 items-center justify-center rounded-2xl border bg-card shadow-xs">
          <LogoMark className="size-12" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-4xl">ExpertCTX for Confluence</h1>
            <Badge variant="success">Free in beta</Badge>
          </div>
          <p className="text-muted-foreground">
            Rovo agent and expert directory. Experts&apos; frameworks applied to your team&apos;s own pages.
          </p>
          <div className="flex flex-wrap gap-2 text-muted-foreground text-xs">
            <Badge variant="outline">Confluence Cloud</Badge>
            <Badge variant="outline">Rovo agent</Badge>
            <Badge variant="outline">Built on Forge</Badge>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {INSTALL_URL ? (
            <Button size="xl" render={<a href={INSTALL_URL} target="_blank" rel="noreferrer" />}>
              Get it now
              <ArrowRight aria-hidden />
            </Button>
          ) : (
            <Button size="xl" disabled>
              Install link coming soon
            </Button>
          )}
          <span className="text-center text-muted-foreground text-xs">Needs a site admin</span>
        </div>
      </div>

      <Separator className="my-10" />

      <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
        <div className="space-y-12">
          <section className="space-y-4">
            <h2 className="font-display text-2xl">What you get</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Highlight icon={<Bot aria-hidden />} title="The ExpertCTX agent in Rovo">
                Ask any published expert to review the page you&apos;re on, find the gaps against your goal and suggest
                owners.
              </Highlight>
              <Highlight icon={<FileText aria-hidden />} title="Plan pages with owners">
                Turns the review into a Confluence page with real tasks assigned to your teammates.
              </Highlight>
              <Highlight icon={<Globe aria-hidden />} title="Expert directory in Confluence">
                Browse the marketplace from Apps &gt; ExpertCTX and choose which experts a space uses.
              </Highlight>
              <Highlight icon={<MessageSquare aria-hidden />} title="A demo team to try it on">
                One click creates a sample space with a goal, a draft plan and teammates&apos; pages.
              </Highlight>
            </div>
          </section>

          <section id="setup" className="scroll-mt-24 space-y-4">
            <h2 className="font-display text-2xl">Setup</h2>
            <ol className="space-y-3">
              <SetupStep n={1} title="Use a site with Rovo">
                Rovo Chat needs a paid plan. For testing, a Forge demo site includes Rovo: run{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">forge site provision</code>.
              </SetupStep>
              <SetupStep n={2} title="Install the app">
                Open the install link above as a site admin and choose Confluence.
              </SetupStep>
              <SetupStep n={3} title="Try the demo team (optional)">
                In Confluence, go to Apps &gt; ExpertCTX and click <em>Create demo space</em>.
              </SetupStep>
              <SetupStep n={4} title="Ask the agent">
                Open <em>Q1 Launch Plan (draft)</em>, open Rovo Chat, pick the ExpertCTX agent and choose &ldquo;Review
                this page with the Launch expert&rdquo;.
              </SetupStep>
            </ol>
            <p className="text-muted-foreground text-sm">
              Nothing to configure on the hub. Experts are already published, and the app talks to the hub with a token
              Atlassian signs for each call.
            </p>
          </section>

          <section id="privacy" className="scroll-mt-24 space-y-4">
            <h2 className="font-display text-2xl">What data moves</h2>
            <Card>
              <CardPanel className="space-y-4 p-6">
                <DataRow icon={<Lock aria-hidden />} title="Stays in your Atlassian site">
                  Your pages, their authors, your teammates and the plan pages the agent writes. The app reads and writes
                  them as the signed-in user.
                </DataRow>
                <Separator />
                <DataRow icon={<Server aria-hidden />} title="Sent to the ExpertCTX hub">
                  The question you asked and the expert you picked, so the hub can return the right parts of their
                  knowledge. Plus your site&apos;s cloud ID, for rate limits and usage counts.
                </DataRow>
                <Separator />
                <DataRow icon={<KeyRound aria-hidden />} title="How calls are secured">
                  Every call carries a Forge Invocation Token signed by Atlassian. The hub checks the signature, the app
                  ID and the site before answering.
                </DataRow>
              </CardPanel>
            </Card>
          </section>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardPanel className="space-y-3 p-6 text-sm">
              <h2 className="font-medium">Details</h2>
              <Detail label="Works with" value="Confluence Cloud, Rovo" />
              <Detail label="Platform" value="Atlassian Forge" />
              <Detail label="Price" value="Free during beta" />
              <Detail label="Data residency" value="Team data stays in your site" />
            </CardPanel>
          </Card>
          <Card className="bg-brand-soft/60">
            <CardPanel className="space-y-3 p-6">
              <ShieldCheck className="size-5 text-brand" aria-hidden />
              <h2 className="font-medium">Are you an expert?</h2>
              <p className="text-muted-foreground text-sm">Publish your frameworks and playbooks, and teams can use them tomorrow.</p>
              <Button variant="outline" className="w-full" render={<Link href="/studio" />}>
                Become an expert
              </Button>
            </CardPanel>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Highlight({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2 rounded-xl border p-4">
      <div className="flex items-center gap-2 font-medium text-sm [&_svg]:size-4 [&_svg]:text-brand">
        {icon}
        {title}
      </div>
      <p className="text-muted-foreground text-sm">{children}</p>
    </div>
  );
}

function SetupStep({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-4 rounded-xl border p-4">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary font-medium text-primary-foreground text-sm">
        {n}
      </span>
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        <p className="text-muted-foreground text-sm">{children}</p>
      </div>
    </li>
  );
}

function DataRow({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 [&_svg]:size-4 [&_svg]:text-brand">{icon}</div>
      <div className="space-y-1">
        <p className="font-medium text-sm">{title}</p>
        <p className="text-muted-foreground text-sm">{children}</p>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex items-center gap-1 text-right">
        <Check className="size-3.5 text-success" aria-hidden />
        {value}
      </span>
    </div>
  );
}
