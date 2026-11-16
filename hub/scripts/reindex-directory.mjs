/**
 * Re-index every published profile in the vector "directory" namespace
 * (marketplace search and profile matching). Safe to run any time.
 *
 *   node --env-file=.env.local scripts/reindex-directory.mjs
 */
import { Redis } from "@upstash/redis";
import { Index } from "@upstash/vector";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN,
});
const directory = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN,
}).namespace("directory");

const ids = await redis.zrange("profiles:published", 0, -1);
for (const id of ids) {
  const profile = await redis.get(`profile:${id}`);
  const expert = profile && (await redis.get(`expert:${profile.expertId}`));
  if (!profile || !expert || profile.status !== "published") continue;
  const frameworks = [...profile.frameworks.matchAll(/^#{2,3}\s+(.+)$/gm)].map((m) => m[1].trim());
  await directory.upsert({
    id,
    data: [
      `${expert.name}: ${profile.title}`,
      profile.tagline,
      expert.headline,
      `Topics: ${profile.topics.join(", ")}`,
      `Frameworks: ${frameworks.join(", ")}`,
      profile.playbooks.map((p) => p.name).join(", "),
    ]
      .filter(Boolean)
      .join("\n"),
    metadata: { profileId: id },
  });
  console.log("indexed", id);
}
