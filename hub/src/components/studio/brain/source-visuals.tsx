"use client";

import { useState } from "react";
import { AtSign, AudioLines, Bookmark, FileText, Film, Globe, NotebookPen, Play, ScanText, type LucideIcon } from "lucide-react";
import { clock, hostOf } from "@/lib/links";
import { sourceType, type Source, type SourceType } from "@/lib/types";
import { cn } from "@/lib/utils";

export const TYPE_VISUALS: Record<SourceType, { label: string; icon: LucideIcon; tint: string; cover: string }> = {
  article: { label: "Page", icon: Globe, tint: "text-brand", cover: "from-brand/14 to-brand/4" },
  youtube: { label: "Video", icon: Play, tint: "text-destructive-foreground", cover: "from-destructive/14 to-destructive/4" },
  social: { label: "Post", icon: AtSign, tint: "text-ctx-team", cover: "from-ctx-team/18 to-ctx-team/5" },
  pdf: { label: "PDF", icon: FileText, tint: "text-warning-foreground", cover: "from-warning/22 to-warning/6" },
  doc: { label: "File", icon: ScanText, tint: "text-info-foreground", cover: "from-info/14 to-info/4" },
  audio: { label: "Audio", icon: AudioLines, tint: "text-ctx-expert", cover: "from-ctx-expert/16 to-ctx-expert/4" },
  video: { label: "Video", icon: Film, tint: "text-ctx-expert", cover: "from-ctx-expert/16 to-ctx-expert/4" },
  note: { label: "Note", icon: NotebookPen, tint: "text-success-foreground", cover: "from-success/14 to-success/4" },
  link: { label: "Link", icon: Bookmark, tint: "text-muted-foreground", cover: "from-navy/8 to-navy/3" },
};

/** The filters above the library, each covering one or more types. */
export const FILTERS: { key: string; label: string; types: SourceType[] }[] = [
  { key: "pages", label: "Pages", types: ["article"] },
  { key: "videos", label: "Videos", types: ["youtube", "video"] },
  { key: "audio", label: "Audio", types: ["audio"] },
  { key: "files", label: "Files", types: ["pdf", "doc"] },
  { key: "notes", label: "Notes", types: ["note"] },
  { key: "posts", label: "Posts", types: ["social"] },
  { key: "links", label: "Links", types: ["link"] },
];

/** An image that removes itself if it fails to load, so a dead thumbnail never shows a broken glyph. */
export function SafeImg({ src, className, onFail }: { src?: string | null; className?: string; onFail?: () => void }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- thumbnails come from any site an expert links to
    <img
      src={src}
      alt=""
      loading="lazy"
      referrerPolicy="no-referrer"
      className={className}
      onError={() => {
        setFailed(true);
        onFail?.();
      }}
    />
  );
}

/** Favicon, site and author on one quiet line. */
export function Byline({ source, className }: { source: Source; className?: string }) {
  const [iconFailed, setIconFailed] = useState(false);
  const type = sourceType(source);
  const visual = TYPE_VISUALS[type];
  const site = source.meta?.site || (source.url ? hostOf(source.url) : visual.label);
  const parts = [site, source.meta?.author].filter(Boolean);
  return (
    <div className={cn("flex min-w-0 items-center gap-1.5 text-muted-foreground text-xs", className)}>
      {source.meta?.icon && !iconFailed ? (
        <SafeImg src={source.meta.icon} className="size-3.5 shrink-0 rounded-[3px]" onFail={() => setIconFailed(true)} />
      ) : (
        <visual.icon className={cn("size-3.5 shrink-0", visual.tint)} aria-hidden />
      )}
      <span className="truncate font-medium uppercase tracking-wide">{parts.join(" · ")}</span>
    </div>
  );
}

/**
 * The top of a source card. A thumbnail when the link has one; otherwise a
 * cover drawn from what the source is: the opening lines for notes and
 * documents, a waveform for recordings.
 */
export function SourceCover({ source, className }: { source: Source; className?: string }) {
  const type = sourceType(source);
  const visual = TYPE_VISUALS[type];
  const [imageFailed, setImageFailed] = useState(false);
  const image = !imageFailed ? source.meta?.image : null;
  const playable = type === "youtube" || type === "video";

  return (
    <div className={cn("relative aspect-[16/9] overflow-hidden bg-gradient-to-br", visual.cover, className)}>
      {image ? (
        <SafeImg src={image} className="absolute inset-0 size-full object-cover" onFail={() => setImageFailed(true)} />
      ) : type === "audio" || type === "video" ? (
        <Waveform seed={source.id} className={visual.tint} />
      ) : source.excerpt && (type === "note" || type === "doc" || type === "pdf" || type === "article" || type === "social") ? (
        <p className="absolute inset-x-4 top-4 font-heading text-[13px] text-foreground/75 leading-relaxed [mask-image:linear-gradient(to_bottom,black_35%,transparent_74%)]">
          {source.excerpt}
        </p>
      ) : (
        <visual.icon className={cn("absolute top-1/2 left-1/2 size-9 -translate-x-1/2 -translate-y-1/2 opacity-70", visual.tint)} aria-hidden />
      )}

      {image && playable ? (
        <span className="absolute top-1/2 left-1/2 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm">
          <Play className="size-4 translate-x-px fill-current" aria-hidden />
        </span>
      ) : null}
      {source.duration ? (
        <span className="absolute right-2 bottom-2 rounded bg-black/70 px-1.5 py-0.5 font-medium text-[11px] text-white tabular-nums">
          {clock(source.duration)}
        </span>
      ) : null}
      <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-background/90 py-0.5 pr-2 pl-1.5 font-medium text-[11px] shadow-sm backdrop-blur">
        <visual.icon className={cn("size-3", visual.tint)} aria-hidden />
        {visual.label}
      </span>
    </div>
  );
}

function waveform(seed: string): number[] {
  const bars: number[] = [];
  let state = [...seed].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) % 9973, 7);
  for (let i = 0; i < 36; i += 1) {
    state = (state * 73 + 41) % 9973;
    bars.push(18 + (state % 62));
  }
  return bars;
}

/** A decorative waveform, the same every time for the same source. */
function Waveform({ seed, className }: { seed: string; className?: string }) {
  const bars = waveform(seed);
  return (
    <div className={cn("absolute inset-x-5 top-0 bottom-6 flex items-center justify-between", className)} aria-hidden>
      {bars.map((height, i) => (
        <span key={i} className="w-[3px] rounded-full bg-current opacity-45" style={{ height: `${height}%` }} />
      ))}
    </div>
  );
}

export function timeAgo(iso: string): string {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 86_400 * 7) return `${Math.floor(seconds / 86_400)}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function compact(n: number): string {
  if (n < 1000) return String(n);
  if (n < 10_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return `${Math.round(n / 1000)}k`;
}
