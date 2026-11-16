import "server-only";
import { Index } from "@upstash/vector";
import type { Expert, Profile } from "./types";

/**
 * Upstash Vector, one hybrid index with built-in embeddings
 * (dense openai/text-embedding-3-small + sparse BM25), so we upsert and query
 * raw text. Two namespaces:
 *   knowledge  one vector per source chunk, filtered by profileId
 *   directory  one vector per published profile, for "who can help with…"
 */
const index = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL ?? "",
  token: process.env.UPSTASH_VECTOR_REST_TOKEN ?? "",
});

const knowledge = index.namespace("knowledge");
const directory = index.namespace("directory");

export type ChunkMetadata = {
  profileId: string;
  expertId: string;
  sourceId: string;
  sourceTitle: string;
  url: string | null;
  locator: string | null;
};

/** `url` overrides the source link for one chunk, e.g. a video at the moment the passage starts. */
export type Chunk = { text: string; locator: string | null; url?: string | null };

export async function upsertChunks(meta: Omit<ChunkMetadata, "locator">, chunks: Chunk[]) {
  for (let i = 0; i < chunks.length; i += 50) {
    const batch = chunks.slice(i, i + 50).map((chunk, j) => ({
      id: `${meta.sourceId}:${i + j}`,
      data: chunk.text,
      metadata: { ...meta, url: chunk.url ?? meta.url, locator: chunk.locator } satisfies ChunkMetadata,
    }));
    await knowledge.upsert(batch);
  }
}

export async function deleteSourceChunks(sourceId: string) {
  await knowledge.delete({ prefix: `${sourceId}:` });
}

export type Excerpt = {
  text: string;
  sourceId: string;
  source: string;
  url: string | null;
  locator: string | null;
  score: number;
};

export async function searchKnowledge(profileId: string, question: string, topK = 6): Promise<Excerpt[]> {
  if (!question.trim()) return [];
  const results = await knowledge.query<ChunkMetadata>({
    data: question,
    topK,
    includeData: true,
    includeMetadata: true,
    filter: `profileId = '${profileId.replace(/'/g, "")}'`,
  });
  return results
    .filter((r) => r.data && r.metadata)
    .map((r) => ({
      text: r.data as string,
      sourceId: r.metadata!.sourceId,
      source: r.metadata!.sourceTitle,
      url: r.metadata!.url,
      locator: r.metadata!.locator,
      score: Math.round(r.score * 1000) / 1000,
    }));
}

export { frameworkNames } from "./frameworks";
import { frameworkNames } from "./frameworks";

export function directoryText(profile: Profile, expert: Expert) {
  return [
    `${expert.name}: ${profile.title}`,
    profile.tagline,
    expert.headline,
    `Topics: ${profile.topics.join(", ")}`,
    `Frameworks: ${frameworkNames(profile.frameworks).join(", ")}`,
    profile.playbooks.map((p) => p.name).join(", "),
  ]
    .filter(Boolean)
    .join("\n");
}

export async function indexDirectory(profile: Profile, expert: Expert) {
  if (profile.status !== "published") return removeFromDirectory(profile.id);
  await directory.upsert({
    id: profile.id,
    data: directoryText(profile, expert),
    metadata: { profileId: profile.id },
  });
}

export async function removeFromDirectory(profileId: string) {
  await directory.delete(profileId);
}

/** Profile ids ranked by meaning. Throws if the index has no embedding model. */
export async function searchDirectory(query: string, topK = 20): Promise<{ id: string; score: number }[]> {
  const results = await directory.query({ data: query, topK });
  return results.map((r) => ({ id: String(r.id), score: r.score }));
}
