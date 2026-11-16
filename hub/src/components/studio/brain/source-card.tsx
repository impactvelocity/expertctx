"use client";

import { useEffect, useState, useTransition } from "react";
import { CircleAlert, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteSourceAction, reindexSourceAction } from "@/app/studio/actions";
import { sourceType, type Source } from "@/lib/types";
import { cn } from "@/lib/utils";
import { RemoveButton } from "./remove-button";
import { Byline, compact, SourceCover, timeAgo } from "./source-visuals";
import { toastResult } from "../use-toast-result";

/** What a pending card cycles through after the reader's own stage, so a long read never looks stuck. */
const THINKING = ["Pulling out the key ideas", "Splitting it into passages", "Filing it where it can be found"];

function useCycle(lines: string[], active: boolean) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setIndex((i) => i + 1), 2600);
    return () => clearInterval(timer);
  }, [active]);
  return lines[index % lines.length];
}

export function SourceCard({ profileId, source, onOpen }: { profileId: string; source: Source; onOpen: () => void }) {
  const [busy, start] = useTransition();
  const type = sourceType(source);
  const pending = source.status === "pending";
  const failed = source.status === "failed";
  const line = useCycle([source.stage ?? "Reading", ...THINKING], pending);

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border bg-card transition-[box-shadow,transform,border-color] duration-200",
        "hover:-translate-y-0.5 hover:border-navy/20 hover:shadow-lg hover:shadow-navy/8",
        failed && "border-destructive/30",
        busy && "pointer-events-none opacity-60",
      )}
    >
      <SourceCover source={source} className={cn(pending && "opacity-60 saturate-50")} />
      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        <Byline source={source} />
        <h3 className="line-clamp-2 font-medium text-sm leading-snug">
          {/* The whole card opens the source; this button stretches over it. */}
          <button type="button" onClick={onOpen} className="text-left outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-2 focus-visible:after:ring-ring">
            {source.title}
          </button>
        </h3>

        {pending ? (
          <p key={line} className="fade-in slide-in-from-bottom-1 animate-in text-brand text-xs duration-300">
            {line}…
          </p>
        ) : failed ? (
          <p className="line-clamp-2 flex gap-1.5 text-destructive-foreground text-xs">
            <CircleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
            {source.error ?? "Couldn't read this."}
          </p>
        ) : source.excerpt && source.meta?.image ? (
          <p className="line-clamp-2 text-muted-foreground text-xs leading-relaxed">{source.excerpt}</p>
        ) : null}

        <div className="mt-auto flex items-center gap-2 pt-1.5 text-muted-foreground text-xs">
          {pending ? (
            <span className="font-medium text-brand">In progress</span>
          ) : failed ? (
            <span className="font-medium text-destructive-foreground">Not read</span>
          ) : type === "link" ? (
            <span>Kept as a link</span>
          ) : (
            <span>
              <span className="font-medium text-foreground tabular-nums">{source.chunkCount}</span> passage{source.chunkCount === 1 ? "" : "s"}
              {source.words ? <span className="tabular-nums"> · {compact(source.words)} words</span> : null}
            </span>
          )}
          <span className="ml-auto shrink-0 transition-opacity group-focus-within:opacity-0 group-hover:opacity-0" suppressHydrationWarning>
            {timeAgo(source.createdAt)}
          </span>
        </div>
      </div>

      {/* Quick actions sit above the stretched button. */}
      <div className="absolute right-2.5 bottom-2.5 z-10 flex gap-1 opacity-0 transition-opacity has-[[data-armed]]:opacity-100 group-focus-within:opacity-100 group-hover:opacity-100">
        {failed ? (
          <Button
            variant="outline"
            size="icon-xs"
            aria-label="Try reading again"
            onClick={() => start(async () => toastResult(await reindexSourceAction(profileId, source.id)))}
          >
            <RotateCw aria-hidden />
          </Button>
        ) : null}
        <RemoveButton
          compact
          label={`Remove ${source.title}`}
          onRemove={() => start(async () => toastResult(await deleteSourceAction(profileId, source.id)))}
        />
      </div>

      {pending ? (
        <div className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden bg-brand/15" aria-hidden>
          <div className="brain-sweep h-full w-1/3 rounded-full bg-brand" />
        </div>
      ) : null}
    </article>
  );
}
