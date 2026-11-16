import "server-only";
import { readFile } from "./blob";
import { getProfile, getSource, updateSource } from "./data";
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
        current = current.slice(-OVERLAP_CHARS) + "\n\n" + paragraph;
      } else {
        current = current ? `${current}\n\n${paragraph}` : paragraph;
      }
      // A single huge paragraph: hard-split it.
      while (current.length > CHUNK_CHARS * 1.5) {
        chunks.push({ text: current.slice(0, CHUNK_CHARS).trim(), locator: section.heading });
        current = current.slice(CHUNK_CHARS - OVERLAP_CHARS);
      }
    }
    if (current.trim()) chunks.push({ text: current.trim(), locator: section.heading });
  }
  return chunks.filter((c) => c.text.length > 20);
}

async function textFromUrl(url: string): Promise<{ title: string | null; text: string }> {
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

/**
 * Turn a source into searchable chunks. Runs after the response is sent
 * (Next's after()), and records success or the error on the source.
 */
export async function ingestSource(sourceId: string) {
  const source = await getSource(sourceId);
  if (!source) return;
  const profile = await getProfile(source.profileId);
  if (!profile) return;

  try {
    let text = "";
    let title = source.title;
    if (source.kind === "text") {
      text = source.text ?? "";
    } else if (source.kind === "url" && source.url) {
      const page = await textFromUrl(source.url);
      text = page.text;
      if (page.title && (!title || title === source.url)) title = page.title;
    } else if (source.kind === "file" && source.blobPath) {
      const data = await readFile(source.blobPath);
      text = source.contentType === "application/pdf" ? await textFromPdf(data) : new TextDecoder().decode(data);
    }

    text = text.slice(0, MAX_TEXT_CHARS);
    const chunks = chunkText(text);
    if (!chunks.length) throw new Error("No text found in this source");

    await deleteSourceChunks(source.id);
    await upsertChunks(
      { profileId: profile.id, expertId: profile.expertId, sourceId: source.id, sourceTitle: title, url: source.url },
      chunks,
    );
    await updateSource(source.id, { status: "indexed", chunkCount: chunks.length, error: null, title });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("ingest failed", source.id, message);
    const friendly = /embedding model/i.test(message)
      ? "The vector index has no embedding model yet, so text can't be indexed."
      : message.slice(0, 300);
    await updateSource(source.id, { status: "failed", error: friendly });
  }
}
