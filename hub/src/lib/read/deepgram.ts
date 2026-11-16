import "server-only";
import { transcribeWithElevenLabs } from "./elevenlabs";
import type { Segment } from "./scrape-creators";

export type Transcript = { text: string; segments: Segment[]; duration: number | null };

type DeepgramSentence = { text: string; start: number };
type DeepgramResponse = {
  metadata?: { duration?: number };
  results?: {
    channels?: {
      alternatives?: {
        transcript?: string;
        paragraphs?: { paragraphs?: { sentences?: DeepgramSentence[] }[] };
      }[];
    }[];
  };
};

/**
 * Deepgram: the first way the hub turns an uploaded recording or video into
 * text. Deepgram fetches the file itself from `url` (a short-lived signed
 * link), so the bytes never pass through this server.
 */
export async function transcribeWithDeepgram(url: string, apiKey: string): Promise<Transcript> {
  const params = new URLSearchParams({ model: "nova-3", smart_format: "true", paragraphs: "true", detect_language: "true" });
  const response = await fetch(`https://api.deepgram.com/v1/listen?${params}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Token ${apiKey}` },
    body: JSON.stringify({ url }),
    signal: AbortSignal.timeout(280_000),
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 200);
    throw new Error(`Transcription failed (${response.status}). ${detail}`);
  }

  const result = (await response.json()) as DeepgramResponse;
  const alternative = result.results?.channels?.[0]?.alternatives?.[0];
  const segments: Segment[] = (alternative?.paragraphs?.paragraphs ?? [])
    .flatMap((paragraph) => paragraph.sentences ?? [])
    .map((sentence) => ({ text: sentence.text.trim(), start: sentence.start }))
    .filter((s) => s.text);
  const text = segments.length ? segments.map((s) => s.text).join(" ") : (alternative?.transcript ?? "").trim();
  if (!text) throw new Error("No speech found in this recording");
  return { text, segments, duration: result.metadata?.duration ?? null };
}

/**
 * Turn a recording into text: Deepgram first, ElevenLabs Scribe if Deepgram
 * has no key or fails. `fileUrl` is asked for a fresh signed link each time,
 * since one can expire while the first service is still working.
 */
export async function transcribe(fileUrl: () => Promise<string>): Promise<Transcript> {
  const deepgram = process.env.DEEPGRAM_API_KEY;
  const elevenLabs = process.env.ELEVEN_LABS_API_KEY ?? process.env.ELEVENLABS_API_KEY;
  if (!deepgram && !elevenLabs) {
    throw new Error("Recordings and video need a Deepgram or ElevenLabs key, and neither is set yet.");
  }

  let failure: unknown = null;
  if (deepgram) {
    try {
      return await transcribeWithDeepgram(await fileUrl(), deepgram);
    } catch (error) {
      failure = error;
      console.error("deepgram failed", error instanceof Error ? error.message : error);
    }
  }
  if (elevenLabs) return transcribeWithElevenLabs(await fileUrl(), elevenLabs);
  throw failure;
}
