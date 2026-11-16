"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { BookOpenText, CircleAlert, ExternalLink, Info, RotateCw, ScanText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetDescription, SheetFooter, SheetHeader, SheetPanel, SheetPopup, SheetTitle } from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { deleteSourceAction, readLinkAction, reindexSourceAction, renameSourceAction, sourceTextAction } from "@/app/studio/actions";
import { formatBytes } from "@/lib/files";
import { clock } from "@/lib/links";
import { sourceType, type Source } from "@/lib/types";
import { cn } from "@/lib/utils";
import { RemoveButton } from "./remove-button";
import { Byline, compact, SourceCover, TYPE_VISUALS } from "./source-visuals";
import { toastResult } from "../use-toast-result";

/** One source, opened: what it is, what was read from it, and what to do with it. */
export function SourceSheet({ profileId, source, onClose }: { profileId: string; source: Source | null; onClose: () => void }) {
  // Opening lands focus on the header, not in the title field, so nothing looks half-edited.
  const header = useRef<HTMLDivElement>(null);
  return (
    <Sheet open={Boolean(source)} onOpenChange={(open) => !open && onClose()}>
      <SheetPopup side="right" className="sm:max-w-xl" initialFocus={header}>
        {source ? <SourceDetail key={source.id} profileId={profileId} source={source} onClose={onClose} header={header} /> : null}
      </SheetPopup>
    </Sheet>
  );
}

function SourceDetail({
  profileId,
  source,
  onClose,
  header,
}: {
  profileId: string;
  source: Source;
  onClose: () => void;
  header: React.RefObject<HTMLDivElement | null>;
}) {
  const [busy, start] = useTransition();
  const [title, setTitle] = useState(source.title);
  const [text, setText] = useState<string | null>(null);
  const type = sourceType(source);
  const visual = TYPE_VISUALS[type];
  const indexed = source.status === "indexed";
  const isLink = type === "link";

  useEffect(() => {
    if (!indexed || isLink) return;
    let stale = false;
    sourceTextAction(profileId, source.id).then((result) => {
      if (!stale) setText(result.text);
    });
    return () => {
      stale = true;
    };
  }, [profileId, source.id, indexed, isLink, source.chunkCount]);

  const saveTitle = () => {
    const next = title.trim();
    if (!next || next === source.title) return setTitle(source.title);
    start(async () => toastResult(await renameSourceAction(profileId, source.id, next)));
  };

  const facts = [
    indexed && !isLink ? { label: "Passages", value: String(source.chunkCount) } : null,
    source.words ? { label: "Words", value: compact(source.words) } : null,
    source.duration ? { label: "Length", value: clock(source.duration) } : null,
    source.size && source.kind === "file" ? { label: "Size", value: formatBytes(source.size) } : null,
    { label: "Added", value: new Date(source.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) },
  ].filter((fact): fact is { label: string; value: string } => Boolean(fact));

  return (
    <>
      <SheetHeader ref={header} tabIndex={-1} className="border-b py-3.5 pr-14 outline-none">
        <SheetTitle className="sr-only">{source.title}</SheetTitle>
        <SheetDescription className="sr-only">{visual.label} in this brain</SheetDescription>
        <Byline source={source} />
      </SheetHeader>

      <SheetPanel className="space-y-5 pt-5!">
        <div className="space-y-3">
          <SourceCover source={source} className="aspect-[5/2] rounded-xl border" />
          <textarea
            value={title}
            onChange={(event) => setTitle(event.target.value.replace(/\n/g, " "))}
            onBlur={saveTitle}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                event.currentTarget.blur();
              }
            }}
            rows={1}
            maxLength={160}
            aria-label="Title"
            className="field-sizing-content -mx-2 block w-[calc(100%+1rem)] resize-none rounded-lg bg-transparent px-2 py-1 font-display text-2xl leading-tight outline-none transition-colors hover:bg-accent focus:bg-accent"
          />
          {source.url ? (
            <a
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex max-w-full items-center gap-1.5 text-muted-foreground text-sm hover:text-brand"
            >
              <ExternalLink className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">{source.url.replace(/^https?:\/\/(www\.)?/, "")}</span>
            </a>
          ) : null}
          <dl className="flex flex-wrap gap-x-7 gap-y-2 border-y py-3">
            {facts.map((fact) => (
              <div key={fact.label}>
                <dt className="text-muted-foreground text-xs">{fact.label}</dt>
                <dd className="font-medium text-sm tabular-nums">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {source.status === "failed" ? (
          <Callout tone="error" icon={<CircleAlert aria-hidden />}>
            {source.error ?? "Couldn't read this source."}
          </Callout>
        ) : null}
        {source.note ? (
          <Callout tone="warning" icon={<Info aria-hidden />}>
            {source.note}
          </Callout>
        ) : null}

        {source.status === "pending" ? (
          <div className="flex items-center gap-2.5 rounded-xl border bg-brand-soft/60 px-3.5 py-3 text-sm">
            <Spinner className="size-4 text-brand" />
            {source.stage ?? "Reading"}…
          </div>
        ) : isLink ? (
          <div className="space-y-3 rounded-xl border bg-surface-sunken px-4 py-3.5">
            <p className="text-sm leading-relaxed">
              Kept as a link. The agent knows it exists and can point a team to it, but hasn&apos;t read what&apos;s behind it.
            </p>
            {source.meta?.description ? <p className="text-muted-foreground text-sm leading-relaxed">{source.meta.description}</p> : null}
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => start(async () => toastResult(await readLinkAction(profileId, source.id)))}
            >
              <ScanText aria-hidden />
              Read the page too
            </Button>
          </div>
        ) : indexed ? (
          <section className="space-y-2.5">
            <h3 className="flex items-center gap-2 font-medium text-sm">
              <BookOpenText className="size-4 text-brand" aria-hidden />
              What your brain read
            </h3>
            {text === null ? (
              <div className="space-y-2.5 pt-1">
                {[92, 100, 84, 96, 70].map((width, i) => (
                  <div key={i} className="h-3 animate-pulse rounded bg-muted" style={{ width: `${width}%` }} />
                ))}
              </div>
            ) : text ? (
              <ReadText text={text} />
            ) : (
              <p className="text-muted-foreground text-sm">The text isn&apos;t stored for this source. Read it again to see it here.</p>
            )}
          </section>
        ) : null}
      </SheetPanel>

      <SheetFooter className="flex-row justify-between sm:justify-between">
        <RemoveButton
          label="Remove"
          disabled={busy}
          onRemove={() =>
            start(async () => {
              const result = await deleteSourceAction(profileId, source.id);
              toastResult(result);
              if (result.ok) onClose();
            })
          }
        />
        {!isLink ? (
          <Button
            variant="outline"
            disabled={busy || source.status === "pending"}
            onClick={() => start(async () => toastResult(await reindexSourceAction(profileId, source.id)))}
          >
            <RotateCw aria-hidden />
            Read again
          </Button>
        ) : null}
      </SheetFooter>
    </>
  );
}

function Callout({ tone, icon, children }: { tone: "error" | "warning"; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "flex gap-2.5 rounded-xl border px-3.5 py-3 text-sm leading-relaxed [&_svg]:mt-0.5 [&_svg]:size-4 [&_svg]:shrink-0",
        tone === "error" ? "border-destructive/25 bg-destructive/6 text-destructive-foreground" : "border-warning/40 bg-warning/10 text-warning-foreground",
      )}
    >
      {icon}
      <p>{children}</p>
    </div>
  );
}

/** The text as it was read. Timestamps from transcripts become small markers. */
function ReadText({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/).slice(0, 400);
  return (
    <div className="space-y-3 rounded-xl border bg-surface-sunken px-4 py-3.5 text-sm leading-relaxed">
      {blocks.map((block, i) => {
        const stamp = /^\*\*(\d+:\d{2}(?::\d{2})?)\*\*\s+/.exec(block);
        const heading = /^#{1,4}\s+(.+)$/.exec(block.trim());
        if (heading) {
          return (
            <p key={i} className="pt-1 font-medium">
              {heading[1]}
            </p>
          );
        }
        return (
          <p key={i} className="whitespace-pre-wrap break-words">
            {stamp ? (
              <span className="mr-2 inline-block rounded bg-brand/10 px-1.5 py-px font-medium text-brand text-xs tabular-nums">{stamp[1]}</span>
            ) : null}
            {stamp ? block.slice(stamp[0].length) : block}
          </p>
        );
      })}
    </div>
  );
}
