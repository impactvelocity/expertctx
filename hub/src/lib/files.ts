import type { SourceType } from "./types";

/** The files the brain can read, by extension. Shared by the picker and the upload route. */
const FILE_TYPES: Record<string, { contentType: string; type: SourceType }> = {
  pdf: { contentType: "application/pdf", type: "pdf" },
  md: { contentType: "text/markdown", type: "doc" },
  markdown: { contentType: "text/markdown", type: "doc" },
  txt: { contentType: "text/plain", type: "doc" },
  csv: { contentType: "text/csv", type: "doc" },
  json: { contentType: "application/json", type: "doc" },
  html: { contentType: "text/html", type: "doc" },
  htm: { contentType: "text/html", type: "doc" },
  vtt: { contentType: "text/vtt", type: "doc" },
  srt: { contentType: "text/plain", type: "doc" },
  mp3: { contentType: "audio/mpeg", type: "audio" },
  m4a: { contentType: "audio/mp4", type: "audio" },
  wav: { contentType: "audio/wav", type: "audio" },
  ogg: { contentType: "audio/ogg", type: "audio" },
  oga: { contentType: "audio/ogg", type: "audio" },
  opus: { contentType: "audio/ogg", type: "audio" },
  flac: { contentType: "audio/flac", type: "audio" },
  aac: { contentType: "audio/aac", type: "audio" },
  mp4: { contentType: "video/mp4", type: "video" },
  m4v: { contentType: "video/mp4", type: "video" },
  mov: { contentType: "video/quicktime", type: "video" },
  webm: { contentType: "video/webm", type: "video" },
  mkv: { contentType: "video/x-matroska", type: "video" },
};

export const FILE_ACCEPT = Object.keys(FILE_TYPES)
  .map((extension) => `.${extension}`)
  .join(",");

export const MAX_DOC_BYTES = 30 * 1024 * 1024;
export const MAX_MEDIA_BYTES = 1024 * 1024 * 1024;

/** How a file will be stored and read, or why it can't be. */
export function describeFile(file: { name: string; type: string; size: number }):
  | { ok: true; contentType: string; type: SourceType; title: string }
  | { ok: false; message: string } {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const known = FILE_TYPES[extension];
  if (!known) return { ok: false, message: `${file.name}: that file type isn't supported yet. Try a PDF, text, audio or video file.` };
  // A .webm from the voice recorder is audio; from a screen recorder it's video.
  const audioWebm = extension === "webm" && file.type.startsWith("audio/");
  const type = audioWebm ? "audio" : known.type;
  const media = type === "audio" || type === "video";
  if (file.size > (media ? MAX_MEDIA_BYTES : MAX_DOC_BYTES)) {
    return { ok: false, message: `${file.name} is too large. ${media ? "Recordings can be up to 1 GB." : "Documents can be up to 30 MB."}` };
  }
  if (!file.size) return { ok: false, message: `${file.name} is empty.` };
  return {
    ok: true,
    contentType: audioWebm ? "audio/webm" : known.contentType,
    type,
    title: titleFromName(file.name),
  };
}

/** "launch-week_checklist.md" reads better as "Launch week checklist". */
function titleFromName(name: string): string {
  const base = name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
  return base ? base[0].toUpperCase() + base.slice(1) : name;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}
