import "server-only";
import type { LinkKind } from "../links";

/**
 * Scrape Creators: how the hub reads video and social posts, which a page
 * reader cannot. YouTube, TikTok and Instagram come back as transcripts;
 * X and LinkedIn posts as their text.
 *
 * Nothing here throws. A failed read comes back as `ok: false` with an error
 * the expert can act on, and the caller falls back to reading the page.
 */

const BASE = "https://api.scrapecreators.com";

/** One stretch of speech, with where it starts in seconds. */
export type Segment = { text: string; start: number };

export type SocialRead =
  | { ok: true; text: string; segments: Segment[]; author: string; title: string }
  | { ok: false; error: string };

type Json = Record<string, unknown>;

async function scGet(path: string, params: Record<string, string>): Promise<{ ok: true; body: Json } | { ok: false; error: string }> {
  const apiKey = process.env.SCRAPE_CREATORS_API_KEY;
  if (!apiKey) return { ok: false, error: "SCRAPE_CREATORS_API_KEY is not set" };
  try {
    const response = await fetch(`${BASE}${path}?${new URLSearchParams(params)}`, {
      headers: { "x-api-key": apiKey },
      signal: AbortSignal.timeout(60_000),
    });
    const body = (await response.json()) as Json;
    if (!response.ok || body?.success === false) {
      return { ok: false, error: String(body?.message || body?.error || `Request failed (${response.status})`) };
    }
    return { ok: true, body };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

const clean = (value: unknown) => String(value ?? "").replace(/\s+/g, " ").trim();

/** A YouTube video's captions, cue by cue. A transcript never changes, so the longest cache window is used. */
export async function readYoutube(url: string): Promise<SocialRead> {
  const result = await scGet("/v1/youtube/video/transcript", { url, cache_max_age: "30d" });
  if (!result.ok) return result;
  const { body } = result;
  // A dead video id answers 200 with `notFound` rather than an error status.
  if (body.notFound) return { ok: false, error: "No video found at that link" };

  const cues = Array.isArray(body.transcript) ? (body.transcript as Json[]) : [];
  const respace = lineBreakRestorer(String(body.transcript_only_text ?? ""));
  const segments = cues
    .map((cue) => ({ text: clean(respace(String(cue.text ?? ""))), start: Number(cue.startMs) / 1000 || 0 }))
    .filter((s) => s.text);
  const text = segments.length ? segments.map((s) => s.text).join(" ") : clean(body.transcript_only_text);
  if (!text) return { ok: false, error: "This video has no transcript" };
  return { ok: true, text, segments, author: "", title: "" };
}

/**
 * Cue text arrives with its line breaks removed, which glues words together
 * ("in front of theelephants"). The flat transcript keeps them, so each cue is
 * found there, in order, and read back with its breaks as spaces.
 */
function lineBreakRestorer(flat: string): (cue: string) => string {
  if (!flat.includes("\n")) return (cue) => cue;
  let stripped = "";
  const origin: number[] = [];
  for (let i = 0; i < flat.length; i += 1) {
    if (flat[i] === "\n") continue;
    origin.push(i);
    stripped += flat[i];
  }
  let cursor = 0;
  return (cue) => {
    const at = cue ? stripped.indexOf(cue, cursor) : -1;
    if (at < 0) return cue;
    cursor = at + cue.length;
    return flat.slice(origin[at], origin[cursor - 1] + 1);
  };
}

/** WebVTT cues ("00:00:01.840 --> 00:00:03.000" then text) as segments. */
function segmentsFromVtt(vtt: string): Segment[] {
  const segments: Segment[] = [];
  for (const block of vtt.split(/\n\s*\n/)) {
    const lines = block.trim().split("\n");
    const at = lines.findIndex((line) => line.includes("-->"));
    if (at < 0) continue;
    const stamp = /(?:(\d+):)?(\d+):(\d+)(?:\.\d+)?\s*-->/.exec(lines[at]);
    const text = clean(lines.slice(at + 1).join(" "));
    if (stamp && text) segments.push({ text, start: Number(stamp[1] ?? 0) * 3600 + Number(stamp[2]) * 60 + Number(stamp[3]) });
  }
  return segments;
}

function timed(value: unknown): Segment[] {
  return Array.isArray(value)
    ? (value as Json[]).map((s) => ({ text: clean(s.text), start: Number(s.start) || 0 })).filter((s) => s.text)
    : [];
}

async function readTiktok(url: string): Promise<SocialRead> {
  const result = await scGet("/v1/tiktok/video/transcript", { url, use_ai_as_fallback: "true" });
  if (!result.ok) return result;
  const raw = String(result.body.transcript ?? "");
  let segments = timed(result.body.transcript_with_timestamp);
  if (!segments.length && raw.includes("-->")) segments = segmentsFromVtt(raw);
  const text = segments.length ? segments.map((s) => s.text).join(" ") : clean(raw.replace(/^WEBVTT/, ""));
  if (!text) return { ok: false, error: "This TikTok has no transcript" };
  return { ok: true, text, segments, author: "", title: "" };
}

async function readInstagram(url: string): Promise<SocialRead> {
  const result = await scGet("/v2/instagram/media/transcript", { url, cache_max_age: "30d" });
  if (!result.ok) return result;
  const items = Array.isArray(result.body.transcripts) ? (result.body.transcripts as Json[]) : [];
  const segments = items.flatMap((item) => timed(item.transcript_with_timestamp));
  const text = items.map((item) => clean(item.text)).filter(Boolean).join("\n\n");
  if (!text) return { ok: false, error: "This post has no speech to transcribe" };
  return { ok: true, text, segments: items.length === 1 ? segments : [], author: "", title: "" };
}

const at = (value: unknown, ...path: string[]): unknown =>
  path.reduce<unknown>((node, key) => (node && typeof node === "object" ? (node as Json)[key] : undefined), value);

async function readTweet(url: string): Promise<SocialRead> {
  const result = await scGet("/v1/twitter/tweet", { url, trim: "true", cache_max_age: "30d" });
  if (!result.ok) return result;
  const { body } = result;
  const text = String(at(body, "note_tweet", "note_tweet_results", "result", "text") ?? at(body, "legacy", "full_text") ?? body.full_text ?? body.text ?? "").trim();
  if (!text) return { ok: false, error: "Couldn't read that post" };
  const user = at(body, "core", "user_results", "result", "legacy") as Json | undefined;
  const author = clean(user?.name);
  const handle = clean(user?.screen_name);
  return { ok: true, text, segments: [], author, title: author ? `${author}${handle ? ` (@${handle})` : ""} on X` : "" };
}

async function readLinkedin(url: string): Promise<SocialRead> {
  const result = await scGet("/v1/linkedin/post", { url });
  if (!result.ok) return result;
  const { body } = result;
  const text = [body.articleBody, body.text, body.headline, body.description]
    .map((value) => String(value ?? "").trim())
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)[0];
  if (!text) return { ok: false, error: "Couldn't read that post" };
  const author = clean(at(body, "author", "name"));
  return { ok: true, text, segments: [], author, title: clean(body.name) || (author ? `${author} on LinkedIn` : "") };
}

/** Read a video or post with the endpoint that fits its platform. */
export function readSocial(kind: LinkKind, url: string): Promise<SocialRead> {
  switch (kind) {
    case "youtube":
      return readYoutube(url);
    case "tiktok":
      return readTiktok(url);
    case "instagram":
      return readInstagram(url);
    case "x":
      return readTweet(url);
    case "linkedin":
      return readLinkedin(url);
    default:
      return Promise.resolve({ ok: false, error: "Not a post we can read" });
  }
}
