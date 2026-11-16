"use client";

import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@upstash/blob/browser";
import { ArrowUp, Bookmark, Check, CircleAlert, Mic, NotebookPen, Paperclip, ScanText, Square, X } from "lucide-react";
import { Lozenge } from "@/components/brand/lozenge";
import { Button } from "@/components/ui/button";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Spinner } from "@/components/ui/spinner";
import { toastManager } from "@/components/ui/toast";
import { Tooltip, TooltipPopup, TooltipTrigger } from "@/components/ui/tooltip";
import { addLinksAction, addNoteAction, previewLinksAction, type LinkPreview } from "@/app/studio/actions";
import { describeFile, FILE_ACCEPT, formatBytes } from "@/lib/files";
import { clock, hostOf, parseCapture } from "@/lib/links";
import { cn } from "@/lib/utils";
import { SafeImg, TYPE_VISUALS } from "./source-visuals";
import { toastResult } from "../use-toast-result";

export type CaptureHandle = {
  addFiles: (files: File[]) => void;
  insertText: (text: string) => void;
  focus: () => void;
};

type UploadRow = {
  id: string;
  name: string;
  size: number;
  percent: number;
  status: "uploading" | "done" | "error";
  error?: string;
};

const PLACEHOLDERS = [
  "Paste a link to something you wrote…",
  "Drop in a YouTube talk or podcast…",
  "Write down a rule you always follow…",
  "Paste a transcript, a thread, a teardown…",
  "Add a PDF, a deck, a recording…",
];

/**
 * The one place everything enters a profile's brain. It works out what was
 * given (links, a note, files, a voice recording) so the expert never picks a
 * type first.
 */
export function Capture({
  profileId,
  ref,
}: {
  profileId: string;
  ref?: React.Ref<CaptureHandle>;
}) {
  const router = useRouter();
  const textarea = useRef<HTMLTextAreaElement>(null);
  const filePicker = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [previews, setPreviews] = useState<Record<string, LinkPreview>>({});
  const [modes, setModes] = useState<Record<string, "read" | "link">>({});
  const [uploads, setUploads] = useState<UploadRow[]>([]);
  const [submitting, startSubmit] = useTransition();
  const [placeholder, setPlaceholder] = useState(0);

  const capture = useMemo(() => parseCapture(value), [value]);
  const urls = useMemo(() => (capture.kind === "links" ? capture.urls : []), [capture]);

  // Rotate the placeholder while the box is empty, to hint at everything it takes.
  useEffect(() => {
    if (value) return;
    const timer = setInterval(() => setPlaceholder((i) => (i + 1) % PLACEHOLDERS.length), 3200);
    return () => clearInterval(timer);
  }, [value]);

  // Look up titles and thumbnails for links as they are pasted.
  useEffect(() => {
    const missing = urls.filter((url) => !previews[url]);
    if (!missing.length) return;
    let stale = false;
    const timer = setTimeout(async () => {
      const found = await previewLinksAction(profileId, missing).catch(() => []);
      if (stale) return;
      setPreviews((current) => ({ ...current, ...Object.fromEntries(found.map((p) => [p.url, p])) }));
    }, 350);
    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [urls, previews, profileId]);

  const addFiles = useCallback(
    (files: File[], title?: string) => {
      for (const file of files) {
        const described = describeFile(file);
        if (!described.ok) {
          toastManager.add({ title: described.message, type: "error" });
          continue;
        }
        const id = crypto.randomUUID();
        const patch = (next: Partial<UploadRow>) => setUploads((rows) => rows.map((row) => (row.id === id ? { ...row, ...next } : row)));
        setUploads((rows) => [...rows, { id, name: title ?? file.name, size: file.size, percent: 0, status: "uploading" }]);

        const task = upload(file, { route: "/api/upload", input: { profileId, ...(title ? { title } : {}) } });
        const stop = task.subscribe(() => patch({ percent: task.snapshot().percent }));
        task.done
          .then(() => {
            patch({ status: "done", percent: 100 });
            router.refresh();
            setTimeout(() => setUploads((rows) => rows.filter((row) => row.id !== id)), 1400);
          })
          .catch((error: unknown) => {
            patch({ status: "error", error: error instanceof Error ? error.message : "Upload failed" });
          })
          .finally(stop);
      }
    },
    [profileId, router],
  );

  useImperativeHandle(
    ref,
    () => ({
      addFiles,
      insertText: (text) => {
        setValue((current) => (current.trim() ? `${current.trimEnd()}\n${text}` : text));
        textarea.current?.focus();
      },
      focus: () => textarea.current?.focus(),
    }),
    [addFiles],
  );

  const recorder = useRecorder((file, title) => addFiles([file], title));

  const ready = urls.filter((url) => !previews[url]?.duplicate);
  const canSubmit = capture.kind === "note" ? capture.text.length >= 20 : ready.length > 0;

  function submit() {
    if (!canSubmit || submitting) return;
    startSubmit(async () => {
      const result =
        capture.kind === "note"
          ? await addNoteAction(profileId, { title: noteTitle, text: capture.text })
          : await addLinksAction(
              profileId,
              ready.map((url) => ({ url, mode: modes[url] ?? "read" })),
            );
      toastResult(result);
      if (result.ok) {
        setValue("");
        setNoteTitle("");
        router.refresh();
      }
    });
  }

  function removeUrl(url: string) {
    setValue(urls.filter((u) => u !== url).join("\n"));
  }

  const submitLabel =
    capture.kind === "note" ? "Add note" : ready.length > 1 ? `Add ${ready.length} links` : ready.length === 1 ? "Add to brain" : "Add to brain";

  return (
    <div className="relative">
      {/* A soft glow so the capture box reads as the centre of the page. */}
      <div
        aria-hidden
        className="-inset-x-6 -top-6 -bottom-4 pointer-events-none absolute rounded-[2.5rem] bg-[radial-gradient(60%_80%_at_30%_0%,color-mix(in_oklab,var(--brand)_16%,transparent),transparent_70%),radial-gradient(50%_70%_at_85%_20%,color-mix(in_oklab,var(--ctx-expert)_14%,transparent),transparent_70%)] blur-2xl"
      />
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border bg-card shadow-lg shadow-navy/5 transition-[border-color,box-shadow] duration-200",
          "focus-within:border-brand/45 focus-within:shadow-brand/10 focus-within:shadow-xl focus-within:ring-4 focus-within:ring-brand/10",
        )}
      >
        <textarea
          ref={textarea}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
            // Enter adds links straight away; a note needs ⌘↵ so Enter can still make a new line.
            if (event.metaKey || event.ctrlKey || (capture.kind === "links" && !event.shiftKey)) {
              event.preventDefault();
              submit();
            }
          }}
          onPaste={(event) => {
            const files = [...event.clipboardData.files];
            if (!files.length) return;
            event.preventDefault();
            addFiles(files);
          }}
          rows={1}
          aria-label="Add to this brain"
          placeholder={PLACEHOLDERS[placeholder]}
          className="field-sizing-content block max-h-72 min-h-[5.25rem] w-full resize-none bg-transparent px-5 pt-4.5 pb-2 text-base leading-relaxed outline-none placeholder:text-muted-foreground/70"
        />

        {capture.kind === "links" ? (
          <ul className="space-y-2 px-3 pb-3">
            {urls.map((url) => (
              <LinkPreviewRow
                key={url}
                url={url}
                preview={previews[url]}
                mode={modes[url] ?? "read"}
                onMode={(mode) => setModes((current) => ({ ...current, [url]: mode }))}
                onRemove={() => removeUrl(url)}
              />
            ))}
          </ul>
        ) : null}

        {capture.kind === "note" ? (
          <div className="mx-3 mb-3 flex items-center gap-2.5 rounded-xl border bg-background px-3 py-2">
            <NotebookPen className="size-4 shrink-0 text-success-foreground" aria-hidden />
            <input
              value={noteTitle}
              onChange={(event) => setNoteTitle(event.target.value)}
              maxLength={120}
              placeholder="Title this note (optional)"
              aria-label="Note title"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
            />
            <span className="shrink-0 text-muted-foreground text-xs tabular-nums">
              {capture.text.split(/\s+/).filter(Boolean).length} words
            </span>
          </div>
        ) : null}

        {uploads.length ? (
          <ul className="space-y-2 px-3 pb-3">
            {uploads.map((row) => (
              <UploadProgress key={row.id} row={row} onDismiss={() => setUploads((rows) => rows.filter((r) => r.id !== row.id))} />
            ))}
          </ul>
        ) : null}

        <div className="flex items-center gap-1.5 border-t bg-surface-sunken/70 px-3 py-2.5">
          {recorder.recording ? (
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span className="relative flex size-2.5 shrink-0">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-destructive opacity-60" />
                <span className="relative inline-flex size-2.5 rounded-full bg-destructive" />
              </span>
              <span className="font-medium text-sm tabular-nums">{clock(recorder.seconds)}</span>
              <span className="truncate text-muted-foreground text-sm">Recording. Say what you know; it&apos;s transcribed for you.</span>
              <div className="ml-auto flex shrink-0 items-center gap-1.5">
                <Button variant="ghost" size="sm" onClick={recorder.cancel}>
                  Discard
                </Button>
                <Button size="sm" onClick={recorder.stop}>
                  <Square className="fill-current" aria-hidden />
                  Stop and add
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => filePicker.current?.click()}>
                <Paperclip aria-hidden />
                <span className="max-sm:sr-only">Upload</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={recorder.start}>
                <Mic aria-hidden />
                <span className="max-sm:sr-only">Record</span>
              </Button>
              <p className="ml-1.5 hidden min-w-0 truncate text-muted-foreground text-xs lg:block">
                Web pages, YouTube, social posts, PDFs, audio, video, notes
              </p>
              <div className="ml-auto flex shrink-0 items-center gap-2.5">
                {value ? (
                  <KbdGroup className="hidden sm:inline-flex">
                    {capture.kind === "note" ? <Kbd>⌘</Kbd> : null}
                    <Kbd>↵</Kbd>
                  </KbdGroup>
                ) : null}
                <Button size="sm" onClick={submit} disabled={!canSubmit} loading={submitting}>
                  <ArrowUp aria-hidden />
                  {submitLabel}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      <input
        ref={filePicker}
        type="file"
        multiple
        accept={FILE_ACCEPT}
        className="hidden"
        onChange={(event) => {
          addFiles([...(event.target.files ?? [])]);
          event.target.value = "";
        }}
      />
    </div>
  );
}

function LinkPreviewRow({
  url,
  preview,
  mode,
  onMode,
  onRemove,
}: {
  url: string;
  preview: LinkPreview | undefined;
  mode: "read" | "link";
  onMode: (mode: "read" | "link") => void;
  onRemove: () => void;
}) {
  const visual = preview ? TYPE_VISUALS[preview.kind === "profile" ? "link" : preview.kind === "youtube" ? "youtube" : preview.kind === "pdf" ? "pdf" : preview.kind === "web" ? "article" : "social"] : null;
  return (
    <li className="fade-in slide-in-from-bottom-1 flex animate-in items-center gap-3 rounded-xl border bg-background p-2.5 duration-200">
      <div className="relative flex h-14 w-[5.5rem] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
        {visual ? <visual.icon className={cn("size-5", visual.tint)} aria-hidden /> : <Spinner className="size-4 text-muted-foreground" />}
        {preview?.meta.image ? <SafeImg src={preview.meta.image} className="absolute inset-0 size-full object-cover" /> : null}
      </div>
      <div className="min-w-0 flex-1 space-y-0.5">
        {preview ? (
          <>
            <div className="flex min-w-0 items-center gap-1.5 text-muted-foreground text-xs">
              <SafeImg src={preview.meta.icon} className="size-3.5 shrink-0 rounded-[3px]" />
              <span className="truncate font-medium uppercase tracking-wide">
                {[preview.meta.site || hostOf(url), preview.meta.author].filter(Boolean).join(" · ")}
              </span>
            </div>
            <p className="truncate font-medium text-sm">{preview.meta.title || url}</p>
            <p className="truncate text-muted-foreground text-xs">{preview.meta.description || url}</p>
          </>
        ) : (
          <>
            <p className="truncate text-muted-foreground text-xs">{url}</p>
            <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-2.5 w-1/2 animate-pulse rounded bg-muted" />
          </>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {!preview ? null : preview.duplicate ? (
          <Lozenge>Already here</Lozenge>
        ) : preview.reads ? (
          <div className="flex rounded-lg bg-muted p-0.5" role="group" aria-label="How to keep this link">
            <ModeButton active={mode === "read"} onClick={() => onMode("read")} tip={`Reads the ${preview.reads.toLowerCase()} into passages the agent can quote.`}>
              <ScanText aria-hidden />
              {preview.reads}
            </ModeButton>
            <ModeButton active={mode === "link"} onClick={() => onMode("link")} tip="Keeps the link without reading it. The agent can point teams to it.">
              <Bookmark aria-hidden />
              Link only
            </ModeButton>
          </div>
        ) : (
          <Tooltip>
            <TooltipTrigger render={<span />}>
              <Lozenge>
                <Bookmark aria-hidden />
                Link only
              </Lozenge>
            </TooltipTrigger>
            <TooltipPopup>Profile pages have nothing to read, so this is kept as a link.</TooltipPopup>
          </Tooltip>
        )}
        <Button variant="ghost" size="icon-xs" aria-label="Remove link" onClick={onRemove}>
          <X aria-hidden />
        </Button>
      </div>
    </li>
  );
}

function ModeButton({ active, onClick, tip, children }: { active: boolean; onClick: () => void; tip: string; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-pressed={active}
            onClick={onClick}
            className={cn(
              "inline-flex h-6 items-center gap-1 rounded-md px-2 font-medium text-xs transition-colors [&_svg]:size-3",
              active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipPopup>{tip}</TooltipPopup>
    </Tooltip>
  );
}

function UploadProgress({ row, onDismiss }: { row: UploadRow; onDismiss: () => void }) {
  return (
    <li className="relative overflow-hidden rounded-xl border bg-background px-3 py-2.5">
      <div className="flex items-center gap-2.5">
        {row.status === "done" ? (
          <Check className="size-4 shrink-0 text-success-foreground" aria-hidden />
        ) : row.status === "error" ? (
          <CircleAlert className="size-4 shrink-0 text-destructive-foreground" aria-hidden />
        ) : (
          <Spinner className="size-4 shrink-0 text-brand" />
        )}
        <p className="min-w-0 flex-1 truncate font-medium text-sm">{row.name}</p>
        <span className={cn("shrink-0 text-xs tabular-nums", row.status === "error" ? "text-destructive-foreground" : "text-muted-foreground")}>
          {row.status === "error" ? row.error : row.status === "done" ? "Uploaded" : `${row.percent}% of ${formatBytes(row.size)}`}
        </span>
        {row.status === "error" ? (
          <Button variant="ghost" size="icon-xs" aria-label="Dismiss" onClick={onDismiss}>
            <X aria-hidden />
          </Button>
        ) : null}
      </div>
      {row.status === "uploading" ? (
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-muted">
          <div className="h-full bg-brand transition-[width] duration-300" style={{ width: `${row.percent}%` }} />
        </div>
      ) : null}
    </li>
  );
}

/** Record a voice note with the microphone and hand it over as an audio file. */
function useRecorder(onDone: (file: File, title: string) => void) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const session = useRef<{ recorder: MediaRecorder; keep: boolean } | null>(null);
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (!recording) return;
    const started = Date.now();
    const timer = setInterval(() => setSeconds(Math.floor((Date.now() - started) / 1000)), 500);
    return () => clearInterval(timer);
  }, [recording]);

  // Leaving the page mid-recording must release the microphone.
  useEffect(
    () => () => {
      if (session.current) {
        session.current.keep = false;
        session.current.recorder.stop();
      }
    },
    [],
  );

  async function start() {
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      toastManager.add({ title: "This browser can't record audio. Upload a recording instead.", type: "error" });
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      toastManager.add({ title: "Allow microphone access to record a voice note.", type: "error" });
      return;
    }
    const mimeType = ["audio/webm", "audio/mp4"].find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    const parts: Blob[] = [];
    const current = { recorder, keep: true };
    session.current = current;
    recorder.ondataavailable = (event) => {
      if (event.data.size) parts.push(event.data);
    };
    recorder.onstop = () => {
      for (const track of stream.getTracks()) track.stop();
      session.current = null;
      setRecording(false);
      setSeconds(0);
      if (!current.keep || !parts.length) return;
      const type = recorder.mimeType || mimeType || "audio/webm";
      const extension = type.includes("mp4") ? "m4a" : "webm";
      const when = new Date().toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
      done.current(new File(parts, `voice-note.${extension}`, { type: type.split(";")[0] }), `Voice note, ${when}`);
    };
    recorder.start(1000);
    setRecording(true);
  }

  const finish = (keep: boolean) => {
    if (!session.current) return;
    session.current.keep = keep;
    session.current.recorder.stop();
  };

  return { recording, seconds, start, stop: () => finish(true), cancel: () => finish(false) };
}
