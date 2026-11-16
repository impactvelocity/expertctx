"use client";

import { useActionState, useState } from "react";
import { BrainCircuit, Lightbulb, ListChecks, Settings2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardPanel, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { saveKnowledgeAction, saveOverviewAction } from "@/app/studio/actions";
import { SECTIONS, type Profile, type Source } from "@/lib/types";
import { BrainView } from "./brain/brain-view";
import { FieldRow } from "./field-row";
import { PlaybooksPanel } from "./playbooks-panel";
import { PreviewPanel } from "./preview-panel";
import { useToastResult } from "./use-toast-result";

const VIEWS = [
  { value: "brain", label: "Brain", icon: BrainCircuit },
  { value: "core", label: "Principles", icon: Lightbulb },
  { value: "playbooks", label: "Playbooks", icon: ListChecks },
  { value: "ask", label: "Test", icon: Sparkles },
  { value: "settings", label: "Settings", icon: Settings2 },
];

/** Links from before the brain view used the old tab names. */
const LEGACY: Record<string, string> = { sources: "brain", knowledge: "core", preview: "ask", overview: "settings" };

export function ProfileEditor({ profile, sources, initialTab }: { profile: Profile; sources: Source[]; initialTab: string }) {
  const start = LEGACY[initialTab] ?? initialTab;
  const [view, setView] = useState(VIEWS.some((v) => v.value === start) ? start : "brain");
  const open = (value: string) => {
    setView(value);
    window.history.replaceState(null, "", `?tab=${value}`);
    window.scrollTo({ top: 0 });
  };
  return (
    <Tabs value={view} onValueChange={(value) => open(String(value))} className="gap-6">
      <div className="overflow-x-auto [scrollbar-width:none]">
        <TabsList>
          {VIEWS.map((v) => (
            <TabsTab key={v.value} value={v.value} className="gap-1.5 px-3.5">
              <v.icon aria-hidden />
              {v.label}
              {v.value === "brain" && sources.length ? <Count>{sources.length}</Count> : null}
              {v.value === "playbooks" && profile.playbooks.length ? <Count>{profile.playbooks.length}</Count> : null}
            </TabsTab>
          ))}
        </TabsList>
      </div>
      <TabsPanel value="brain">
        <BrainView profile={profile} sources={sources} onOpenCore={open} />
      </TabsPanel>
      <TabsPanel value="core">
        <KnowledgeForm profile={profile} />
      </TabsPanel>
      <TabsPanel value="playbooks">
        <PlaybooksPanel profile={profile} />
      </TabsPanel>
      <TabsPanel value="ask">
        <PreviewPanel profile={profile} />
      </TabsPanel>
      <TabsPanel value="settings">
        <OverviewForm profile={profile} />
      </TabsPanel>
    </Tabs>
  );
}

function Count({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-navy/8 px-1.5 text-muted-foreground text-xs tabular-nums">{children}</span>;
}

function OverviewForm({ profile }: { profile: Profile }) {
  const [result, action, pending] = useActionState(saveOverviewAction.bind(null, profile.id), null);
  useToastResult(result);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
        <CardDescription>How this profile appears in the marketplace, and how the agent should sound.</CardDescription>
      </CardHeader>
      <CardPanel>
        <form action={action} className="grid gap-5 md:grid-cols-2">
          <FieldRow label="Title">
            <Input name="title" defaultValue={profile.title} required maxLength={60} />
          </FieldRow>
          <FieldRow label="Topics" description="Comma separated. Used for search and filters.">
            <Input name="topics" defaultValue={profile.topics.join(", ")} placeholder="launch, positioning, waitlist" />
          </FieldRow>
          <div className="md:col-span-2">
            <FieldRow label="Tagline">
              <Input name="tagline" defaultValue={profile.tagline} maxLength={160} />
            </FieldRow>
          </div>
          <div className="md:col-span-2">
            <FieldRow label="Voice" description="How you'd say it: tone, phrasing, what you lead with.">
              <Textarea name="voice" defaultValue={profile.voice} rows={4} maxLength={2000} />
            </FieldRow>
          </div>
          <div className="md:col-span-2">
            <Button type="submit" loading={pending}>
              Save settings
            </Button>
          </div>
        </form>
      </CardPanel>
    </Card>
  );
}

const PLACEHOLDERS: Record<string, string> = {
  frameworks: "## Audience before launch day\nA launch only sells to people already paying attention.\n- Pick one audience and one promise.\n- Start a waitlist 4 weeks out.",
  rules: "- Never launch to an empty list.\n- Always name the one number that says it worked.",
  redFlags: "- **“We'll announce it on social.”** Without a list, launch day is quiet. Costs: the launch.",
  examples: "**Good:** “Founding price ends Friday” with a real deadline.\n**Bad:** Four plans side by side on launch day.",
};

function KnowledgeForm({ profile }: { profile: Profile }) {
  const [result, action, pending] = useActionState(saveKnowledgeAction.bind(null, profile.id), null);
  useToastResult(result);
  return (
    <form action={action} className="space-y-4">
      <div className="divide-y overflow-hidden rounded-xl border bg-card">
        {SECTIONS.map((section) => (
          <div key={section.key} className="grid gap-4 p-5 md:grid-cols-[220px_1fr]">
            <div className="space-y-1">
              <h3 className="font-semibold">{section.label}</h3>
              <p className="text-muted-foreground text-sm">{section.hint}</p>
            </div>
            <Textarea
              name={section.key}
              defaultValue={profile[section.key]}
              placeholder={PLACEHOLDERS[section.key]}
              className="font-mono text-xs"
              rows={8}
              aria-label={section.label}
            />
          </div>
        ))}
      </div>
      <div className="sticky bottom-4 flex items-center justify-between gap-4 rounded-xl border bg-background/90 px-4 py-3 shadow-lg backdrop-blur">
        <p className="text-muted-foreground text-sm">Markdown works. The agent gets all four sections in full on every question.</p>
        <Button type="submit" loading={pending}>
          Save knowledge
        </Button>
      </div>
    </form>
  );
}
