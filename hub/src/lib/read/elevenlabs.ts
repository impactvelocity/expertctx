import "server-only";
import type { Segment } from "./scrape-creators";

type ScribeWord = { text: string; type: "word" | "spacing" | "audio_event"; start: number | null };
type ScribeResponse = { text?: string; words?: ScribeWord[]; audio_duration_secs?: number; detail?: unknown };

/**
 * ElevenLabs Scribe: the second way to turn a recording into text, used when
 * Deepgram has no key or fails. Like Deepgram, it fetches the file itself
 * from `url`.
 */
export async function transcribeWithElevenLabs(url: string, apiKey: string): Promise<{ text: string; segments: Segment[]; duration: number | null }> {
  const form = new FormData();
  form.set("model_id", "scribe_v2");
  form.set("source_url", url);
  form.set("tag_audio_events", "false");

  const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: { "xi-api-key": apiKey },
    body: form,
    signal: AbortSignal.timeout(280_000),
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 200);
    throw new Error(`Transcription failed (${response.status}). ${detail}`);
  }

  const result = (await response.json()) as ScribeResponse;
  const segments = sentences(result.words ?? []);
  const text = (result.text ?? "").trim() || segments.map((s) => s.text).join(" ");
  if (!text) throw new Error("No speech found in this recording");
  const last = (result.words ?? []).findLast((word) => word.start != null);
  return { text, segments, duration: result.audio_duration_secs ?? last?.start ?? null };
}

/** Scribe answers word by word; passages want sentences, each with where it starts. */
function sentences(words: ScribeWord[]): Segment[] {
  const segments: Segment[] = [];
  let text = "";
  let start: number | null = null;
  const flush = () => {
    if (text.trim()) segments.push({ text: text.trim(), start: start ?? 0 });
    text = "";
    start = null;
  };
  for (const word of words) {
    if (word.type === "audio_event") continue;
    if (word.type === "word" && start === null) start = word.start;
    text += word.text;
    if (word.type === "word" && /[.!?]["')\]]?$/.test(word.text)) flush();
  }
  flush();
  return segments;
}
