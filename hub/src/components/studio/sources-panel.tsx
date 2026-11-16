"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, ClipboardPaste, FileText, Link2, RefreshCw, Trash2, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardPanel, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toastManager } from "@/components/ui/toast";
import { addTextSourceAction, addUrlSourceAction, deleteSourceAction, reindexSourceAction } from "@/app/studio/actions";
import type { Source } from "@/lib/types";
import { FieldRow } from "./field-row";
import { toastResult, useToastResult } from "./use-toast-result";

export function SourcesPanel({ profileId, sources }: { profileId: string; sources: Source[] }) {
  const router = useRouter();
  const pendingCount = sources.filter((s) => s.status === "pending").length;

  // While anything is indexing, refresh every few seconds to pick up the result.
  useEffect(() => {
    if (!pendingCount) return;
    const timer = setInterval(() => router.refresh(), 3000);
    return () => clearInterval(timer);
  }, [pendingCount, router]);

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Add a source</CardTitle>
          <CardDescription>Your talks, posts and notes. Split into passages and searched by meaning.</CardDescription>
        </CardHeader>
        <CardPanel>
          <Tabs defaultValue="text" className="gap-4">
            <TabsList className="w-full">
              <TabsTab value="text">
                <ClipboardPaste aria-hidden />
                Paste
              </TabsTab>
              <TabsTab value="url">
                <Link2 aria-hidden />
                Link
              </TabsTab>
              <TabsTab value="file">
                <Upload aria-hidden />
                File
              </TabsTab>
            </TabsList>
            <TabsPanel value="text">
              <TextSourceForm profileId={profileId} />
            </TabsPanel>
            <TabsPanel value="url">
              <UrlSourceForm profileId={profileId} />
            </TabsPanel>
            <TabsPanel value="file">
              <FileSourceForm profileId={profileId} />
            </TabsPanel>
          </Tabs>
        </CardPanel>
      </Card>

      <div className="space-y-3">
        {sources.length ? (
          sources.map((source) => <SourceRow key={source.id} profileId={profileId} source={source} />)
        ) : (
          <Empty className="rounded-2xl border border-dashed bg-background py-14">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileText aria-hidden />
              </EmptyMedia>
              <EmptyTitle>No sources yet</EmptyTitle>
              <EmptyDescription>
                Sources are optional. Your frameworks and rules already reach the agent; sources add your own words and
                examples, quoted with citations.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>
    </div>
  );
}

function SourceRow({ profileId, source }: { profileId: string; source: Source }) {
  const [pending, start] = useTransition();
  const Icon = source.kind === "url" ? Link2 : source.kind === "file" ? Upload : ClipboardPaste;
  return (
    <Card>
      <CardPanel className="flex items-start gap-3 p-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted [&_svg]:size-4">
          <Icon aria-hidden />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-medium text-sm">{source.title}</p>
            {source.status === "indexed" ? (
              <Badge variant="success">
                <CheckCircle2 aria-hidden />
                {source.chunkCount} passage{source.chunkCount === 1 ? "" : "s"}
              </Badge>
            ) : source.status === "pending" ? (
              <Badge variant="info">
                <Spinner className="size-3" />
                Indexing
              </Badge>
            ) : (
              <Badge variant="error">
                <AlertCircle aria-hidden />
                Failed
              </Badge>
            )}
          </div>
          {source.url ? (
            <a href={source.url} target="_blank" rel="noreferrer" className="block truncate text-muted-foreground text-xs hover:underline">
              {source.url}
            </a>
          ) : null}
          {source.error ? <p className="text-destructive-foreground text-xs">{source.error}</p> : null}
          <p className="text-muted-foreground text-xs">Added {new Date(source.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="flex gap-1">
          {source.status === "failed" ? (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Try again"
              disabled={pending}
              onClick={() => start(async () => toastResult(await reindexSourceAction(profileId, source.id)))}
            >
              <RefreshCw aria-hidden />
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Delete source"
            disabled={pending}
            onClick={() => start(async () => toastResult(await deleteSourceAction(profileId, source.id)))}
          >
            <Trash2 aria-hidden />
          </Button>
        </div>
      </CardPanel>
    </Card>
  );
}

function TextSourceForm({ profileId }: { profileId: string }) {
  const [result, action, pending] = useActionState(addTextSourceAction.bind(null, profileId), null);
  const form = useRef<HTMLFormElement>(null);
  useToastResult(result);
  useEffect(() => {
    if (result?.ok) form.current?.reset();
  }, [result]);
  return (
    <form ref={form} action={action} className="space-y-4">
      <FieldRow label="Title">
        <Input name="title" placeholder="Launch talk, SaaStock 2025" required maxLength={120} />
      </FieldRow>
      <FieldRow label="Text" description="Markdown headings become citation points.">
        <Textarea name="text" rows={8} placeholder="Paste a transcript, post or notes…" required />
      </FieldRow>
      <Button type="submit" loading={pending} className="w-full">
        Add text
      </Button>
    </form>
  );
}

function UrlSourceForm({ profileId }: { profileId: string }) {
  const [result, action, pending] = useActionState(addUrlSourceAction.bind(null, profileId), null);
  const form = useRef<HTMLFormElement>(null);
  useToastResult(result);
  useEffect(() => {
    if (result?.ok) form.current?.reset();
  }, [result]);
  return (
    <form ref={form} action={action} className="space-y-4">
      <FieldRow label="URL" description="A blog post, article or public PDF.">
        <Input name="url" type="url" placeholder="https://…" required />
      </FieldRow>
      <FieldRow label="Title (optional)">
        <Input name="title" placeholder="We'll use the page title" maxLength={120} />
      </FieldRow>
      <Button type="submit" loading={pending} className="w-full">
        Add link
      </Button>
    </form>
  );
}

function FileSourceForm({ profileId }: { profileId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;
    setPending(true);
    const body = new FormData(event.currentTarget);
    body.set("profileId", profileId);
    body.set("file", file);
    const response = await fetch("/api/sources/upload", { method: "POST", body });
    const json = await response.json().catch(() => ({ ok: false, message: "Upload failed" }));
    setPending(false);
    toastManager.add({ title: json.ok ? "Uploaded. Indexing now." : json.message, type: json.ok ? "success" : "error" });
    if (json.ok) {
      setFile(null);
      event.currentTarget?.reset();
      router.refresh();
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <button
        type="button"
        onClick={() => input.current?.click()}
        className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-8 text-center transition-colors hover:bg-accent"
      >
        <Upload className="size-5 text-muted-foreground" aria-hidden />
        <span className="font-medium text-sm">{file ? file.name : "Choose a file"}</span>
        <span className="text-muted-foreground text-xs">PDF, Markdown or text, up to 4 MB</span>
      </button>
      <input
        ref={input}
        type="file"
        accept=".pdf,.md,.markdown,.txt"
        className="hidden"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />
      <FieldRow label="Title (optional)">
        <Input name="title" placeholder="We'll use the file name" maxLength={120} />
      </FieldRow>
      <Button type="submit" loading={pending} disabled={!file} className="w-full">
        Upload
      </Button>
    </form>
  );
}
