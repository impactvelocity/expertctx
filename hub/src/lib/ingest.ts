import "server-only";
import { fileUrl, putText, readFile } from "./blob";
import { getProfile, getSource, updateSource } from "./data";
import { classifyUrl, clock, isPublicUrl, youtubeId } from "./links";
import { transcribe } from "./read/deepgram";
import { readWithJina } from "./read/jina";
import { fetchLinkMeta } from "./read/link-meta";
import { readSocial, type Segment } from "./read/scrape-creators";
import { sourceType, type Source, type SourceMeta } from "./types";
import { upsertChunks, deleteSourceChunks, type Chunk } from "./vector";

const CHUNK_CHARS = 1800;
const OVERLAP_CHARS = 200;
const MAX_TEXT_CHARS = 400_000;

type Section = { heading: string | null; text: string };

/** Split text into sections at Markdown-style headings. */
function sectionsOf(text: string, fallbackLocator: string | null): Section[] {
  const sections: Section[] = [];
  let heading: string | null = fallbackLocator;
  let lines: string[] = [];
  const flush = () => {
    const body = lines.join("\n").trim();
    if (body) sections.push({ heading, text: body });
    lines = [];
  };
  for (const line of text.split("\n")) {
    const match = /^#{1,4}\s+(.+)$/.exec(line);
    if (match) {
      flush();
      heading = match[1].trim();
    }
    lines.push(line);
  }
  flush();
  return sections;
}

/** The end of one passage, carried into the next. Starts at a sentence or word, never mid-word. */
function overlapOf(text: string): string {
  const tail = text.slice(-OVERLAP_CHARS);
  if (tail.length < OVERLAP_CHARS) return tail;
  const sentence = tail.search(/[.!?]\s+\S/);
  if (sentence >= 0) return tail.slice(sentence + 1).trimStart();
  const word = tail.search(/\s/);
  return word >= 0 ? tail.slice(word).trimStart() : tail;
}

/** Roughly 400-token chunks, cut at paragraph breaks, with a little overlap. */
export function chunkText(text: string, fallbackLocator: string | null = null): Chunk[] {
  const chunks: Chunk[] = [];
  // Form posts use \r\n; headings and paragraph breaks are matched on \n.
  const normalized = text.replace(/\r\n?/g, "\n");
  for (const section of sectionsOf(normalized, fallbackLocator)) {
    const paragraphs = section.text.split(/\n{2,}/);
    let current = "";
    for (const paragraph of paragraphs) {
      if ((current + "\n\n" + paragraph).length > CHUNK_CHARS && current) {
        chunks.push({ text: current.trim(), locator: section.heading });
        current = overlapOf(current) + "\n\n" + paragraph;
      } else {
        current = current ? `${current}\n\n${paragraph}` : paragraph;
      }
      // A single huge paragraph: hard-split it.
      while (current.length > CHUNK_CHARS * 1.5) {
        chunks.push({ text: current.slice(0, CHUNK_CHARS).trim(), locator: section.heading });
        current = overlapOf(current.slice(0, CHUNK_CHARS)) + current.slice(CHUNK_CHARS);
      }
    }
    if (current.trim()) chunks.push({ text: current.trim(), locator: section.heading });
  }
  return chunks.filter((c) => c.text.length > 20);
}

/**
 * Passages from timed speech (a video or recording). Each one remembers when
 * it starts, so a citation can say "12:34" and link to that moment.
 */
export function chunkSegments(segments: Segment[], linkAt?: (seconds: number) => string): Chunk[] {
  const chunks: Chunk[] = [];
  let text = "";
  let start = 0;
  const flush = () => {
    if (text.trim().length > 20) chunks.push({ text: text.trim(), locator: clock(start), url: linkAt?.(start) });
    text = "";
  };
  for (const segment of segments) {
    if (!text) start = segment.start;
    text += `${text ? " " : ""}${segment.text}`;
    if (text.length >= CHUNK_CHARS) flush();
  }
  flush();
  return chunks;
}

/** Timed speech as readable text: a timestamp, then what was said from there. */
function segmentsAsText(segments: Segment[]): string {
  return chunkSegments(segments)
    .map((chunk) => `**${chunk.locator}**  ${chunk.text}`)
    .join("\n\n");
}

/** The page, read directly. The fallback for when Jina can't reach it. */
async function textFromPage(url: string): Promise<{ title: string | null; text: string }> {
  if (!isPublicUrl(url)) throw new Error("That link isn't reachable from the public internet");
  const response = await fetch(url, {
    headers: { "user-agent": "ExpertCTX-Hub/1.0 (+source indexing)", accept: "text/html,text/plain,*/*" },
    redirect: "follow",
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`The page answered ${response.status}`);
  const type = response.headers.get("content-type") ?? "";
  if (type.includes("application/pdf")) {
    return { title: null, text: await textFromPdf(await response.arrayBuffer()) };
  }
  const body = await response.text();
  if (!type.includes("html")) return { title: null, text: body };

  const { parseHTML } = await import("linkedom");
  const { Readability } = await import("@mozilla/readability");
  const { document } = parseHTML(body);
  const article = new Readability(document as unknown as Document).parse();
  const text = article?.textContent?.replace(/\n{3,}/g, "\n\n").trim() ?? "";
  if (!text) throw new Error("Couldn't find readable text on that page");
  return { title: article?.title ?? null, text };
}

async function textFromPdf(data: ArrayBuffer): Promise<string> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(data));
  const { text } = await extractText(pdf, { mergePages: false });
  // Keep page numbers as headings so citations can say "page 4".
  return (text as string[]).map((page, i) => `# Page ${i + 1}\n\n${page.trim()}`).join("\n\n");
}

/** What reading a source produced. `chunks` is set when the reader knows better passage breaks than headings. */
type Reading = {
  text: string;
  chunks?: Chunk[];
  title?: string | null;
  author?: string;
  duration?: number | null;
  note?: string | null;
};

async function readPage(url: string): Promise<Reading> {
  const jina = await readWithJina(url);
  if (jina.ok) return { text: jina.text, title: jina.title };
  return textFromPage(url);
}

async function readUrl(source: Source, meta: SourceMeta): Promise<Reading> {
  const url = source.url as string;
  const kind = classifyUrl(url);

  // A link kept as a reference: index what it is, so the agent can point to it.
  if (source.mode === "link") {
    const text = [meta.title || source.title, meta.description, meta.author && `By ${meta.author}`, url].filter(Boolean).join("\n\n");
    return { text, chunks: [{ text, locator: null }] };
  }

  if (kind === "youtube" || kind === "tiktok" || kind === "instagram" || kind === "x" || kind === "linkedin") {
    const read = await readSocial(kind, url);
    if (read.ok) {
      const video = youtubeId(url);
      const linkAt = video ? (seconds: number) => `https://youtu.be/${video}?t=${Math.floor(seconds)}` : undefined;
      return read.segments.length
        ? { text: segmentsAsText(read.segments), chunks: chunkSegments(read.segments, linkAt), title: read.title, author: read.author }
        : { text: read.text, title: read.title, author: read.author };
    }
    // No transcript or post text. Reading the page instead would index the
    // site's navigation, so keep what the link says about itself and say so.
    console.error("social read failed", kind, read.error);
    const about = [meta.title, meta.author && `By ${meta.author}`, meta.description].filter(Boolean).join("\n\n");
    if (!meta.description) throw new Error(friendlyReadError(read.error));
    return {
      text: about,
      chunks: [{ text: about, locator: null }],
      note: `${friendlyReadError(read.error)} Only the title and description were saved.`,
    };
  }

  if (kind === "pdf" && isPublicUrl(url)) {
    try {
      const response = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(30_000) });
      if (response.ok && (response.headers.get("content-type") ?? "").includes("pdf")) {
        return { text: await textFromPdf(await response.arrayBuffer()) };
      }
    } catch {
      // Fall through to the page reader, which handles PDFs too.
    }
  }
  return readPage(url);
}

function friendlyReadError(error: string): string {
  if (/API_KEY is not set/.test(error)) return "Video and social posts need a Scrape Creators key, which isn't set yet.";
  return error.endsWith(".") ? error : `${error}.`;
}

async function readFileSource(source: Source): Promise<Reading> {
  const path = source.blobPath as string;
  const type = sourceType(source);
  if (type === "audio" || type === "video") {
    const spoken = await transcribe(() => fileUrl(path));
    return spoken.segments.length
      ? { text: segmentsAsText(spoken.segments), chunks: chunkSegments(spoken.segments), duration: spoken.duration }
      : { text: spoken.text, duration: spoken.duration };
  }
  const data = await readFile(path);
  if (source.contentType === "application/pdf") return { text: await textFromPdf(data) };
  const text = new TextDecoder().decode(data);
  // An HTML file reads better without its tags.
  return { text: source.contentType === "text/html" ? text.replace(/<(script|style)[\s\S]*?<\/\1>/gi, "").replace(/<[^>]+>/g, " ") : text };
}

/** The opening of a text with its Markdown stripped, for cards. */
const firstLines = (text: string) =>
  text
    .replace(/^#{1,6}\s+.*$/gm, "")
    .replace(/\*\*\d+:\d+(?::\d+)?\*\*/g, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\bImage \d+:?/g, "")
    .replace(/[*_`>#|]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 320);

/**
 * Turn a source into searchable passages. Runs after the response is sent
 * (Next's after()), and records progress, then success or the error, on the
 * source so the brain view can show what's happening.
 */
export async function ingestSource(sourceId: string) {
  const source = await getSource(sourceId);
  if (!source) return;
  const profile = await getProfile(source.profileId);
  if (!profile) return;
  const type = sourceType(source);
  const stage = (label: string) => updateSource(source.id, { stage: label });

  try {
    let meta = source.meta ?? null;
    let reading: Reading;

    if (source.kind === "url" && source.url) {
      await stage(source.mode === "link" ? "Saving the link" : type === "youtube" ? "Fetching the transcript" : "Reading the page");
      meta = await fetchLinkMeta(source.url);
      reading = await readUrl(source, meta);
    } else if (source.kind === "file" && source.blobPath) {
      await stage(type === "audio" || type === "video" ? "Transcribing" : "Reading the file");
      reading = await readFileSource(source);
    } else {
      reading = { text: source.text ?? "" };
    }

    const text = reading.text.slice(0, MAX_TEXT_CHARS);
    const chunks = reading.chunks ?? chunkText(text);
    if (!chunks.length) throw new Error("No text found in this source");

    // The title someone typed wins; otherwise the best one the readers found.
    const untitled = !source.title || source.title === source.url;
    const title = (untitled ? meta?.title || reading.title : source.title) || source.title || "Untitled";
    if (meta && reading.author && !meta.author) meta = { ...meta, author: reading.author };

    await stage("Filing passages");
    const textPath = source.kind === "text" ? null : await putText(`sources/${profile.id}/${source.id}/extracted.md`, text).catch(() => null);
    await deleteSourceChunks(source.id);
    await upsertChunks(
      { profileId: profile.id, expertId: profile.expertId, sourceId: source.id, sourceTitle: title, url: source.url },
      chunks,
    );
    await updateSource(source.id, {
      status: "indexed",
      chunkCount: chunks.length,
      error: null,
      stage: null,
      title: title.slice(0, 160),
      meta,
      textPath,
      excerpt: source.mode === "link" ? meta?.description || null : firstLines(text),
      words: source.mode === "link" ? null : text.split(/\s+/).filter(Boolean).length,
      duration: reading.duration ?? source.duration ?? null,
      note: reading.note ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("ingest failed", source.id, message);
    const friendly = /embedding model/i.test(message)
      ? "The vector index has no embedding model yet, so text can't be indexed."
      : /timed? ?out|aborted/i.test(message)
        ? "This took too long to read. Try again in a moment."
        : message.slice(0, 300);
    // Failed means nothing of this source is in the brain, including passages from an earlier read.
    await deleteSourceChunks(source.id).catch(() => {});
    await updateSource(source.id, { status: "failed", error: friendly, stage: null, chunkCount: 0, words: null, note: null });
  }
}
