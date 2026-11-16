"use client";

import { useActionState, useState } from "react";
import { BookOpen, FileText, ListChecks, Settings2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardPanel, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { saveKnowledgeAction, saveOverviewAction } from "@/app/studio/actions";
import { SECTIONS, type Profile, type Source } from "@/lib/types";
import { FieldRow } from "./field-row";
import { PlaybooksPanel } from "./playbooks-panel";
import { PreviewPanel } from "./preview-panel";
import { SourcesPanel } from "./sources-panel";
import { useToastResult } from "./use-toast-result";

const TABS = [
  { value: "overview", label: "Overview", icon: Settings2 },
  { value: "knowledge", label: "Knowledge", icon: BookOpen },
  { value: "playbooks", label: "Playbooks", icon: ListChecks },
  { value: "sources", label: "Sources", icon: FileText },
  { value: "preview", label: "Preview", icon: Sparkles },
];

export function ProfileEditor({ profile, sources, initialTab }: { profile: Profile; sources: Source[]; initialTab: string }) {
  const [tab, setTab] = useState(TABS.some((t) => t.value === initialTab) ? initialTab : "overview");
  return (
    <Tabs
      value={tab}
      onValueChange={(value) => {
        setTab(String(value));
        window.history.replaceState(null, "", `?tab=${value}`);
      }}
      className="gap-6"
    >
      <div className="overflow-x-auto">
        <TabsList variant="underline" className="w-full justify-start">
          {TABS.map((t) => (
            <TabsTab key={t.value} value={t.value}>
              <t.icon aria-hidden />
              {t.label}
              {t.value === "sources" && sources.length ? (
                <span className="rounded-full bg-muted px-1.5 text-muted-foreground text-xs">{sources.length}</span>
              ) : null}
              {t.value === "playbooks" && profile.playbooks.length ? (
                <span className="rounded-full bg-muted px-1.5 text-muted-foreground text-xs">{profile.playbooks.length}</span>
              ) : null}
            </TabsTab>
          ))}
        </TabsList>
      </div>
      <TabsPanel value="overview">
        <OverviewForm profile={profile} />
      </TabsPanel>
      <TabsPanel value="knowledge">
        <KnowledgeForm profile={profile} />
      </TabsPanel>
      <TabsPanel value="playbooks">
        <PlaybooksPanel profile={profile} />
      </TabsPanel>
      <TabsPanel value="sources">
        <SourcesPanel profileId={profile.id} sources={sources} />
      </TabsPanel>
      <TabsPanel value="preview">
        <PreviewPanel profile={profile} />
      </TabsPanel>
    </Tabs>
  );
}

function OverviewForm({ profile }: { profile: Profile }) {
  const [result, action, pending] = useActionState(saveOverviewAction.bind(null, profile.id), null);
  useToastResult(result);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Overview</CardTitle>
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
              Save overview
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
      <div className="grid gap-4 lg:grid-cols-2">
        {SECTIONS.map((section) => (
          <Card key={section.key}>
            <CardHeader>
              <CardTitle>{section.label}</CardTitle>
              <CardDescription>{section.hint}</CardDescription>
            </CardHeader>
            <CardPanel>
              <Textarea
                name={section.key}
                defaultValue={profile[section.key]}
                placeholder={PLACEHOLDERS[section.key]}
                className="font-mono text-xs"
                rows={14}
                aria-label={section.label}
              />
            </CardPanel>
          </Card>
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
