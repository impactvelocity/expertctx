"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CloudUpload, Quote, Search, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { askBrainAction } from "@/app/studio/actions";
import { bulletCount, frameworkNames } from "@/lib/frameworks";
import { sourceType, type Profile, type Source } from "@/lib/types";
import type { Excerpt } from "@/lib/vector";
import { cn } from "@/lib/utils";
import { Capture, type CaptureHandle } from "./capture";
import { SourceCard } from "./source-card";
import { SourceSheet } from "./source-sheet";
import { compact, FILTERS, TYPE_VISUALS } from "./source-visuals";

/**
 * The home of a profile: capture at the top, a map of what the brain holds,
 * and the library of everything it has read. Files can be dropped anywhere
 * on the page, and a paste outside any field lands in the capture box.
 */
export function BrainView({ profile, sources, onOpenCore }: { profile: Profile; sources: Source[]; onOpenCore: (area: "core" | "playbooks") => void }) {
  const router = useRouter();
  const capture = useRef<CaptureHandle>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const dragging = useFileDrop((files) => capture.current?.addFiles(files));

  const pendingCount = sources.filter((s) => s.status === "pending").length;
  // While anything is being read, check back every few seconds for the result.
  useEffect(() => {
    if (!pendingCount) return;
    const timer = setInterval(() => router.refresh(), 2500);
    return () => clearInterval(timer);
  }, [pendingCount, router]);

  // A paste with nothing focused belongs in the capture box.
  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true'], [role='dialog']")) return;
      const files = [...(event.clipboardData?.files ?? [])];
      const text = event.clipboardData?.getData("text/plain") ?? "";
      if (files.length) capture.current?.addFiles(files);
      else if (text.trim()) capture.current?.insertText(text.trim());
      else return;
      event.preventDefault();
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, []);

  const counts = useMemo(() => {
    const byFilter: Record<string, number> = {};
    for (const source of sources) {
      const key = FILTERS.find((f) => f.types.includes(sourceType(source)))?.key;
      if (key) byFilter[key] = (byFilter[key] ?? 0) + 1;
    }
    return byFilter;
  }, [sources]);
  const visibleFilters = FILTERS.filter((f) => counts[f.key]);
  const activeFilter = visibleFilters.find((f) => f.key === filter);
  const shown = activeFilter ? sources.filter((s) => activeFilter.types.includes(sourceType(s))) : sources;
  const openSource = sources.find((s) => s.id === openId) ?? null;

  return (
    <div className="space-y-10">
      <section className="space-y-5 pt-2">
        <div className="space-y-1.5">
          <h2 className="font-display text-2xl">What should this brain know?</h2>
          <p className="max-w-2xl text-muted-foreground">
            Drop in anything you&apos;ve made or said. It&apos;s read, split into passages, and recalled when a team asks{" "}
            <span className="text-foreground">{profile.title}</span> a question.
          </p>
        </div>
        <Capture ref={capture} profileId={profile.id} />
      </section>

      <BrainMap profile={profile} sources={sources} onOpenCore={onOpenCore} />

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl">Library</h2>
            <p className="text-muted-foreground text-sm">Everything this brain has read. Open one to see exactly what it took in.</p>
          </div>
          {visibleFilters.length > 1 ? (
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter the library">
              <FilterChip active={!activeFilter} onClick={() => setFilter("all")} count={sources.length}>
                All
              </FilterChip>
              {visibleFilters.map((f) => (
                <FilterChip key={f.key} active={activeFilter?.key === f.key} onClick={() => setFilter(f.key)} count={counts[f.key]}>
                  {f.label}
                </FilterChip>
              ))}
            </div>
          ) : null}
        </div>

        {sources.some((s) => s.status === "indexed") ? <Recall profileId={profile.id} onOpen={setOpenId} /> : null}

        {shown.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {shown.map((source) => (
              <SourceCard key={source.id} profileId={profile.id} source={source} onOpen={() => setOpenId(source.id)} />
            ))}
          </div>
        ) : (
          <EmptyLibrary onStart={() => capture.current?.focus()} />
        )}
      </section>

      <SourceSheet profileId={profile.id} source={openSource} onClose={() => setOpenId(null)} />

      {dragging ? (
        <div className="fade-in pointer-events-none fixed inset-0 z-50 flex animate-in items-center justify-center bg-brand/10 backdrop-blur-sm duration-150">
          <div className="flex flex-col items-center gap-3 rounded-3xl border-2 border-brand border-dashed bg-background px-14 py-12 shadow-2xl">
            <CloudUpload className="size-9 text-brand" aria-hidden />
            <p className="font-display text-2xl">Drop to add to this brain</p>
            <p className="text-muted-foreground text-sm">PDFs, text, audio and video</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FilterChip({ active, onClick, count, children }: { active: boolean; onClick: () => void; count: number; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-full border px-3 font-medium text-xs transition-colors",
        active ? "border-navy bg-navy text-background" : "bg-background text-muted-foreground hover:border-navy/25 hover:text-foreground",
      )}
    >
      {children}
      <span className={cn("tabular-nums", active ? "opacity-70" : "opacity-60")}>{count}</span>
    </button>
  );
}

/**
 * What the brain holds, in the two ways the agent uses it: principles it
 * always has in mind, and sources it recalls when they match the question.
 */
function BrainMap({ profile, sources, onOpenCore }: { profile: Profile; sources: Source[]; onOpenCore: (area: "core" | "playbooks") => void }) {
  const read = sources.filter((s) => s.status === "indexed");
  const passages = read.reduce((sum, s) => sum + s.chunkCount, 0);
  const words = read.reduce((sum, s) => sum + (s.words ?? 0), 0);
  const principles = [
    { label: "Frameworks", value: frameworkNames(profile.frameworks).length, area: "core" as const },
    { label: "Rules", value: bulletCount(profile.rules), area: "core" as const },
    { label: "Red flags", value: bulletCount(profile.redFlags), area: "core" as const },
    { label: "Playbooks", value: profile.playbooks.length, area: "playbooks" as const },
  ];

  return (
    <section className="grid overflow-hidden rounded-2xl border bg-card lg:grid-cols-[1.25fr_1fr]">
      <div className="space-y-3 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 font-medium text-sm">
              <span className="size-2 rounded-full bg-ctx-expert" aria-hidden />
              Always in mind
            </p>
            <p className="text-muted-foreground text-xs">Your principles. The agent gets all of them on every question.</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onOpenCore("core")}>
            Edit
            <ArrowRight aria-hidden />
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {principles.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => onOpenCore(item.area)}
              className="rounded-xl border bg-background px-3 py-2.5 text-left transition-colors hover:border-ctx-expert/40 hover:bg-ctx-expert/5"
            >
              <span className={cn("block font-display text-2xl tabular-nums", !item.value && "text-muted-foreground/60")}>{item.value}</span>
              <span className="block truncate text-muted-foreground text-xs">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-3 border-t bg-surface-sunken/60 p-5 lg:border-t-0 lg:border-l">
        <div>
          <p className="flex items-center gap-2 font-medium text-sm">
            <span className="size-2 rounded-full bg-brand" aria-hidden />
            Recalled when relevant
          </p>
          <p className="text-muted-foreground text-xs">Your library. The agent quotes the passages that match the question.</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Sources", value: String(sources.length) },
            { label: "Passages", value: compact(passages) },
            { label: "Words read", value: compact(words) },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border bg-background px-3 py-2.5">
              <span className={cn("block font-display text-2xl tabular-nums", item.value === "0" && "text-muted-foreground/60")}>{item.value}</span>
              <span className="block truncate text-muted-foreground text-xs">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Ask the library a question and see the passages the agent would be handed. */
function Recall({ profileId, onOpen }: { profileId: string; onOpen: (sourceId: string) => void }) {
  const [question, setQuestion] = useState("");
  const [asked, setAsked] = useState("");
  const [excerpts, setExcerpts] = useState<Excerpt[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const ask = () => {
    const query = question.trim();
    if (!query) return;
    start(async () => {
      const result = await askBrainAction(profileId, query);
      setAsked(query);
      setExcerpts(result.excerpts);
      setMessage(result.ok ? null : (result.message ?? null));
    });
  };
  const clear = () => {
    setQuestion("");
    setExcerpts(null);
    setMessage(null);
  };

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <form
        className="flex items-center gap-2.5 px-3.5 py-2"
        onSubmit={(event) => {
          event.preventDefault();
          ask();
        }}
      >
        {pending ? <Spinner className="size-4 shrink-0 text-brand" /> : <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />}
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Test your recall: ask what a team might ask…"
          aria-label="Ask this brain a question"
          className="h-8 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
        />
        {excerpts ? (
          <Button type="button" variant="ghost" size="icon-xs" aria-label="Clear" onClick={clear}>
            <X aria-hidden />
          </Button>
        ) : null}
        <Button type="submit" variant="outline" size="sm" disabled={!question.trim() || pending}>
          <Sparkles aria-hidden />
          Recall
        </Button>
      </form>

      {excerpts ? (
        <div className="space-y-3 border-t bg-surface-sunken/60 p-3.5">
          <p className="text-muted-foreground text-xs">
            {message ??
              (excerpts.length
                ? `For “${asked}”, the agent would be handed these ${excerpts.length} passages, best match first.`
                : `Nothing in the library matches “${asked}” yet. Add a source that covers it.`)}
          </p>
          {excerpts.length ? (
            <ol className="grid gap-2.5 md:grid-cols-2">
              {excerpts.map((excerpt, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => onOpen(excerpt.sourceId)}
                    className="flex h-full w-full flex-col gap-2 rounded-lg border bg-background p-3 text-left transition-colors hover:border-brand/40"
                  >
                    <span className="flex items-start gap-2 text-sm leading-relaxed">
                      <Quote className="mt-0.5 size-3.5 shrink-0 text-brand" aria-hidden />
                      <span className="line-clamp-4">{plain(excerpt.text)}</span>
                    </span>
                    <span className="mt-auto flex items-center gap-2 text-muted-foreground text-xs">
                      <span className="truncate font-medium text-foreground">{excerpt.source}</span>
                      {excerpt.locator ? <span className="shrink-0 rounded bg-muted px-1.5 py-px tabular-nums">{excerpt.locator}</span> : null}
                      <span className={cn("ml-auto shrink-0", i === 0 && "font-medium text-brand")}>{i === 0 ? "Best match" : `#${i + 1}`}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** A passage without its Markdown, for a quote. */
const plain = (text: string) =>
  text
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();

function EmptyLibrary({ onStart }: { onStart: () => void }) {
  const ideas: (keyof typeof TYPE_VISUALS)[] = ["article", "youtube", "pdf", "audio", "note", "link"];
  const labels: Record<string, string> = {
    article: "A post you wrote",
    youtube: "A talk on YouTube",
    pdf: "A deck or PDF",
    audio: "A podcast or call",
    note: "A thought, typed out",
    link: "A page worth sharing",
  };
  return (
    <div className="rounded-2xl border border-dashed bg-surface-sunken/50 px-6 py-10 text-center">
      <div className="mx-auto mb-5 flex max-w-xl flex-wrap justify-center gap-2">
        {ideas.map((type) => {
          const visual = TYPE_VISUALS[type];
          return (
            <span key={type} className="inline-flex items-center gap-1.5 rounded-full border bg-background py-1 pr-3 pl-2 text-xs shadow-xs">
              <visual.icon className={cn("size-3.5", visual.tint)} aria-hidden />
              {labels[type]}
            </span>
          );
        })}
      </div>
      <h3 className="font-display text-xl">Nothing in the library yet</h3>
      <p className="mx-auto mt-1.5 max-w-md text-muted-foreground text-sm">
        Your principles already reach the agent. Sources add your own words and examples, quoted with a citation back to where you
        said them.
      </p>
      <Button variant="outline" className="mt-5" onClick={onStart}>
        Add the first one
      </Button>
    </div>
  );
}

/** True while files are being dragged over the window; hands them over on drop. */
function useFileDrop(onFiles: (files: File[]) => void) {
  const [dragging, setDragging] = useState(false);
  const handler = useRef(onFiles);
  useEffect(() => {
    handler.current = onFiles;
  }, [onFiles]);

  useEffect(() => {
    let depth = 0;
    const hasFiles = (event: DragEvent) => Boolean(event.dataTransfer?.types.includes("Files"));
    const enter = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      depth += 1;
      setDragging(true);
    };
    const leave = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      depth = Math.max(0, depth - 1);
      if (!depth) setDragging(false);
    };
    const over = (event: DragEvent) => {
      if (hasFiles(event)) event.preventDefault();
    };
    const drop = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      depth = 0;
      setDragging(false);
      const files = [...(event.dataTransfer?.files ?? [])];
      if (files.length) handler.current(files);
    };
    window.addEventListener("dragenter", enter);
    window.addEventListener("dragleave", leave);
    window.addEventListener("dragover", over);
    window.addEventListener("drop", drop);
    return () => {
      window.removeEventListener("dragenter", enter);
      window.removeEventListener("dragleave", leave);
      window.removeEventListener("dragover", over);
      window.removeEventListener("drop", drop);
    };
  }, []);

  return dragging;
}
