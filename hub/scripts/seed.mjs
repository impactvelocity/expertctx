/**
 * Seed the hub with Dylan's expert profiles from the Forge app's seed file,
 * so both sides use the same profile ids (dylan-jones-launch, …).
 *
 *   node --env-file=.env.local scripts/seed.mjs            add what's missing
 *   node --env-file=.env.local scripts/seed.mjs --force    overwrite profile content
 *
 * The expert starts unowned; an admin claims it from /studio.
 */
import { readFile, writeFile, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Redis } from "@upstash/redis";
import { Index } from "@upstash/vector";

const force = process.argv.includes("--force");
const here = dirname(fileURLToPath(import.meta.url));

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN,
});
const directory = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN,
}).namespace("directory");

// The Forge seed file is an ES module in a CommonJS package; import a copy.
const source = await readFile(join(here, "../../app/src/seed/profiles.js"), "utf8");
const dir = await mkdtemp(join(tmpdir(), "expertctx-seed-"));
await writeFile(join(dir, "profiles.mjs"), source);
const { SEED_PROFILES } = await import(join(dir, "profiles.mjs"));

const startedAt = Date.now();
const now = new Date(startedAt).toISOString();
const EXPERT_ID = "dylan-jones";

// Draft playbooks so the demo shows the feature. Placeholder content for
// Dylan to rewrite, like the rest of the seed profiles.
const PLAYBOOKS = {
  "dylan-jones-launch": [
    {
      id: "launch-readiness",
      name: "Launch readiness review",
      whenToUse: "A team has a draft launch plan and a date.",
      steps:
        "1. Name the one audience and one promise. If the plan lists several, flag it.\n" +
        "2. Check the list: how many people, where they came from, and whether warm-up emails exist.\n" +
        "3. Walk the three phases (warm-up, open, close) and mark what's missing in each.\n" +
        "4. Find the one number and who watches it daily.\n" +
        "5. Check for red flags: launching to an empty list, building features in launch week, unowned tasks.\n" +
        "6. Match every gap to the teammate whose pages show they know that area.",
      output:
        "Verdict (ready / not ready), the top 3 gaps each with an owner and the page that supports it, red flags spotted, and the one number to watch.",
    },
  ],
  "dylan-jones-product-design": [
    {
      id: "first-session-review",
      name: "First-session review",
      whenToUse: "A team is redesigning onboarding or a first-run experience.",
      steps:
        "1. State the outcome a new user came for, in their words.\n" +
        "2. Count the steps before that outcome is visible. Flag anything over 3.\n" +
        "3. Find every required step that could be deferred.\n" +
        "4. Check what's shown by default versus what needs setup.\n" +
        "5. Name what to cut.",
      output: "The first win and how fast it arrives, steps to cut or defer, and the quality bar for what stays.",
    },
  ],
  "dylan-jones-funnels-and-offers": [
    {
      id: "funnel-walk",
      name: "Walk the funnel",
      whenToUse: "A team has a signup page, offer or trial flow to review.",
      steps:
        "1. Read the headline as a stranger: does it use the customer's words?\n" +
        "2. Count the offers on the page. One page, one job.\n" +
        "3. Count the fields and the commitments asked for before value.\n" +
        "4. Check what happens after signup: follow-up, deadline, next step.",
      output: "The leak in each step, the fix, and which page or person in the team owns it.",
    },
  ],
};

const first = SEED_PROFILES[0];
let expert = await redis.get(`expert:${EXPERT_ID}`);
if (!expert) {
  expert = {
    id: EXPERT_ID,
    slug: "dylan-jones",
    ownerUserId: null,
    name: first.expertName,
    headline: "20+ years building product and SaaS: launches, product design, funnels and offers.",
    bio: first.bio,
    avatarPath: null,
    links: [],
    verified: true,
    kind: "expert",
    createdAt: now,
    updatedAt: now,
  };
  await redis.set(`expert:${EXPERT_ID}`, expert);
  await redis.set(`expert:slug:${expert.slug}`, EXPERT_ID);
  await redis.sadd("experts", EXPERT_ID);
  console.log("created expert", EXPERT_ID);
} else {
  console.log("expert exists", EXPERT_ID, expert.ownerUserId ? "(claimed)" : "(unclaimed)");
}

for (const [index, seed] of SEED_PROFILES.entries()) {
  const existing = await redis.get(`profile:${seed.id}`);
  if (existing && !force) {
    console.log("skip (exists)", seed.id);
    continue;
  }
  const profile = {
    id: seed.id,
    expertId: EXPERT_ID,
    title: seed.title,
    tagline: seed.tagline,
    topics: seed.topics,
    voice: seed.voice,
    frameworks: seed.frameworks,
    rules: seed.rules,
    redFlags: seed.redFlags,
    examples: seed.examples,
    playbooks: existing?.playbooks?.length ? existing.playbooks : (PLAYBOOKS[seed.id] ?? []),
    status: "published",
    // Stagger creation times so profiles keep the seed file's order (Launch first).
    createdAt: existing?.createdAt ?? new Date(startedAt + index * 1000).toISOString(),
    updatedAt: now,
  };
  await redis.set(`profile:${seed.id}`, profile);
  await redis.sadd(`expert:${EXPERT_ID}:profiles`, seed.id);
  await redis.zadd("profiles:published", { score: Date.now(), member: seed.id });
  console.log(existing ? "updated" : "created", seed.id);

  try {
    const frameworks = [...profile.frameworks.matchAll(/^#{2,3}\s+(.+)$/gm)].map((m) => m[1]);
    await directory.upsert({
      id: profile.id,
      data: [
        `${expert.name}: ${profile.title}`,
        profile.tagline,
        expert.headline,
        `Topics: ${profile.topics.join(", ")}`,
        `Frameworks: ${frameworks.join(", ")}`,
        profile.playbooks.map((p) => p.name).join(", "),
      ].join("\n"),
      metadata: { profileId: profile.id },
    });
  } catch (error) {
    console.warn("  directory index skipped:", error.message);
  }
}
console.log("done");
