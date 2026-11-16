import "server-only";
import { nanoid } from "nanoid";
import { redis } from "./redis";
import type { Expert, Playbook, Profile, ProfileWithExpert, Source } from "./types";

/**
 * Redis layout (values are JSON):
 *   expert:{id}                  Expert
 *   expert:owner:{userId}        expert id
 *   expert:slug:{slug}           expert id
 *   experts                      set of expert ids
 *   expert:{id}:profiles         set of profile ids
 *   profile:{id}                 Profile
 *   profiles:published           sorted set of profile ids by updatedAt
 *   source:{id}                  Source
 *   profile:{id}:sources         sorted set of source ids by createdAt
 *   usage:{profileId}:{yyyy-mm}  counter of knowledge calls
 *   usage-sites:{profileId}:{yyyy-mm}  HyperLogLog of calling sites
 *   install:{cloudId}            first and last seen
 */

export function slugify(text: string): string {
  return String(text || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

const now = () => new Date().toISOString();

// ---------------------------------------------------------------------------
// Experts
// ---------------------------------------------------------------------------

export async function getExpert(id: string): Promise<Expert | null> {
  return id ? redis.get<Expert>(`expert:${id}`) : null;
}

export async function getExpertByOwner(userId: string): Promise<Expert | null> {
  const id = await redis.get<string>(`expert:owner:${userId}`);
  return id ? getExpert(id) : null;
}

export async function getExpertBySlug(slug: string): Promise<Expert | null> {
  const id = await redis.get<string>(`expert:slug:${slug}`);
  return id ? getExpert(id) : null;
}

export async function listExperts(): Promise<Expert[]> {
  const ids = await redis.smembers<string[]>("experts");
  if (!ids.length) return [];
  const experts = await redis.mget<(Expert | null)[]>(...ids.map((id) => `expert:${id}`));
  return experts.filter((e): e is Expert => Boolean(e));
}

async function uniqueSlug(base: string, takenBy?: string): Promise<string> {
  const root = slugify(base) || "expert";
  for (let i = 0; i < 50; i++) {
    const slug = i === 0 ? root : `${root}-${i + 1}`;
    const owner = await redis.get<string>(`expert:slug:${slug}`);
    if (!owner || owner === takenBy) return slug;
  }
  return `${root}-${nanoid(6).toLowerCase()}`;
}

export type ExpertInput = {
  name: string;
  headline: string;
  bio: string;
  links?: { label: string; url: string }[];
};

export async function createExpert(
  input: ExpertInput,
  ownerUserId: string | null,
  options: { id?: string; slug?: string; verified?: boolean; kind?: Expert["kind"] } = {},
): Promise<Expert> {
  const id = options.id ?? nanoid(12);
  const slug = options.slug ?? (await uniqueSlug(input.name, id));
  const expert: Expert = {
    id,
    slug,
    ownerUserId,
    name: input.name.trim(),
    headline: input.headline.trim(),
    bio: input.bio.trim(),
    avatarPath: null,
    links: input.links ?? [],
    verified: options.verified ?? false,
    kind: options.kind ?? "expert",
    createdAt: now(),
    updatedAt: now(),
  };
  const tx = redis.multi();
  tx.set(`expert:${id}`, expert);
  tx.set(`expert:slug:${slug}`, id);
  tx.sadd("experts", id);
  if (ownerUserId) tx.set(`expert:owner:${ownerUserId}`, id);
  await tx.exec();
  return expert;
}

export async function updateExpert(id: string, patch: Partial<Omit<Expert, "id" | "slug" | "createdAt">>) {
  const expert = await getExpert(id);
  if (!expert) throw new Error("Expert not found");
  const next: Expert = { ...expert, ...patch, updatedAt: now() };
  await redis.set(`expert:${id}`, next);
  return next;
}

/** Give an unowned (seeded) expert to a signed-in user. */
export async function claimExpert(id: string, userId: string) {
  const expert = await getExpert(id);
  if (!expert) throw new Error("Expert not found");
  if (expert.ownerUserId && expert.ownerUserId !== userId) throw new Error("This expert already has an owner");
  const existing = await redis.get<string>(`expert:owner:${userId}`);
  if (existing && existing !== id) throw new Error("You already have an expert profile");
  await redis.set(`expert:owner:${userId}`, id);
  return updateExpert(id, { ownerUserId: userId });
}

// ---------------------------------------------------------------------------
// Profiles
// ---------------------------------------------------------------------------

export async function getProfile(id: string): Promise<Profile | null> {
  return id ? redis.get<Profile>(`profile:${id}`) : null;
}

export async function listProfilesForExpert(expertId: string): Promise<Profile[]> {
  const ids = await redis.smembers<string[]>(`expert:${expertId}:profiles`);
  if (!ids.length) return [];
  const profiles = await redis.mget<(Profile | null)[]>(...ids.map((id) => `profile:${id}`));
  return profiles
    .filter((p): p is Profile => Boolean(p))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** Every published profile with its expert. */
export async function listPublishedProfiles(): Promise<ProfileWithExpert[]> {
  const ids = await redis.zrange<string[]>("profiles:published", 0, -1, { rev: true });
  if (!ids.length) return [];
  const profiles = (await redis.mget<(Profile | null)[]>(...ids.map((id) => `profile:${id}`))).filter(
    (p): p is Profile => Boolean(p && p.status === "published"),
  );
  const expertIds = [...new Set(profiles.map((p) => p.expertId))];
  const experts = expertIds.length
    ? await redis.mget<(Expert | null)[]>(...expertIds.map((id) => `expert:${id}`))
    : [];
  const byId = new Map(experts.filter((e): e is Expert => Boolean(e)).map((e) => [e.id, e]));
  // Verified experts first, then each expert's profiles in the order they made them.
  return profiles
    .filter((p) => byId.has(p.expertId))
    .map((p) => ({ ...p, expert: byId.get(p.expertId)! }))
    .sort(
      (a, b) =>
        Number(b.expert.verified) - Number(a.expert.verified) ||
        a.expert.name.localeCompare(b.expert.name) ||
        a.createdAt.localeCompare(b.createdAt),
    );
}

export type ProfileInput = Partial<
  Pick<Profile, "title" | "tagline" | "topics" | "voice" | "frameworks" | "rules" | "redFlags" | "examples" | "playbooks">
>;

async function uniqueProfileId(expert: Expert, title: string): Promise<string> {
  const root = `${expert.slug}-${slugify(title) || "profile"}`.slice(0, 64);
  for (let i = 0; i < 50; i++) {
    const id = i === 0 ? root : `${root}-${i + 1}`;
    if (!(await redis.exists(`profile:${id}`))) return id;
  }
  return `${root}-${nanoid(6).toLowerCase()}`;
}

export async function createProfile(expert: Expert, input: ProfileInput & { title: string }, id?: string) {
  const profile: Profile = {
    id: id ?? (await uniqueProfileId(expert, input.title)),
    expertId: expert.id,
    title: input.title.trim(),
    tagline: input.tagline?.trim() ?? "",
    topics: input.topics ?? [],
    voice: input.voice ?? "",
    frameworks: input.frameworks ?? "",
    rules: input.rules ?? "",
    redFlags: input.redFlags ?? "",
    examples: input.examples ?? "",
    playbooks: input.playbooks ?? [],
    status: "draft",
    createdAt: now(),
    updatedAt: now(),
  };
  const tx = redis.multi();
  tx.set(`profile:${profile.id}`, profile);
  tx.sadd(`expert:${expert.id}:profiles`, profile.id);
  await tx.exec();
  return profile;
}

export async function updateProfile(id: string, patch: ProfileInput & { status?: Profile["status"] }) {
  const profile = await getProfile(id);
  if (!profile) throw new Error("Profile not found");
  const next: Profile = { ...profile, ...patch, updatedAt: now() };
  const tx = redis.multi();
  tx.set(`profile:${id}`, next);
  if (next.status === "published") tx.zadd("profiles:published", { score: Date.now(), member: id });
  else tx.zrem("profiles:published", id);
  await tx.exec();
  return next;
}

export async function deleteProfile(id: string) {
  const profile = await getProfile(id);
  if (!profile) return;
  const sourceIds = await redis.zrange<string[]>(`profile:${id}:sources`, 0, -1);
  const tx = redis.multi();
  tx.del(`profile:${id}`, `profile:${id}:sources`, ...sourceIds.map((s) => `source:${s}`));
  tx.srem(`expert:${profile.expertId}:profiles`, id);
  tx.zrem("profiles:published", id);
  await tx.exec();
  return { profile, sourceIds };
}

export function newPlaybook(input: Omit<Playbook, "id">): Playbook {
  return { id: nanoid(10), ...input };
}

// ---------------------------------------------------------------------------
// Sources
// ---------------------------------------------------------------------------

export async function getSource(id: string): Promise<Source | null> {
  return id ? redis.get<Source>(`source:${id}`) : null;
}

export async function listSources(profileId: string): Promise<Source[]> {
  const ids = await redis.zrange<string[]>(`profile:${profileId}:sources`, 0, -1, { rev: true });
  if (!ids.length) return [];
  const sources = await redis.mget<(Source | null)[]>(...ids.map((id) => `source:${id}`));
  return sources.filter((s): s is Source => Boolean(s));
}

export async function countSources(profileIds: string[]): Promise<Record<string, number>> {
  if (!profileIds.length) return {};
  const tx = redis.multi();
  for (const id of profileIds) tx.zcard(`profile:${id}:sources`);
  const counts = (await tx.exec()) as number[];
  return Object.fromEntries(profileIds.map((id, i) => [id, counts[i] ?? 0]));
}

export async function createSource(input: Omit<Source, "id" | "status" | "chunkCount" | "error" | "createdAt"> & { id?: string }) {
  const source: Source = {
    ...input,
    id: input.id ?? nanoid(12),
    status: "pending",
    chunkCount: 0,
    error: null,
    createdAt: now(),
  };
  const tx = redis.multi();
  tx.set(`source:${source.id}`, source);
  tx.zadd(`profile:${source.profileId}:sources`, { score: Date.now(), member: source.id });
  await tx.exec();
  return source;
}

export async function updateSource(id: string, patch: Partial<Source>) {
  const source = await getSource(id);
  if (!source) return null;
  const next = { ...source, ...patch };
  await redis.set(`source:${id}`, next);
  return next;
}

export async function deleteSource(id: string) {
  const source = await getSource(id);
  if (!source) return null;
  const tx = redis.multi();
  tx.del(`source:${id}`);
  tx.zrem(`profile:${source.profileId}:sources`, id);
  await tx.exec();
  return source;
}

// ---------------------------------------------------------------------------
// Usage and installs
// ---------------------------------------------------------------------------

const month = () => new Date().toISOString().slice(0, 7);

export async function recordUsage(profileId: string, cloudId: string | null) {
  const m = month();
  const tx = redis.multi();
  tx.incr(`usage:${profileId}:${m}`);
  if (cloudId) {
    tx.pfadd(`usage-sites:${profileId}:${m}`, cloudId);
    tx.hset(`install:${cloudId}`, { lastSeen: now() });
    tx.hsetnx(`install:${cloudId}`, "firstSeen", now());
  }
  await tx.exec();
}

export async function getUsage(profileIds: string[]): Promise<Record<string, { calls: number; sites: number }>> {
  if (!profileIds.length) return {};
  const m = month();
  const tx = redis.multi();
  for (const id of profileIds) {
    tx.get(`usage:${id}:${m}`);
    tx.pfcount(`usage-sites:${id}:${m}`);
  }
  const results = (await tx.exec()) as (number | string | null)[];
  return Object.fromEntries(
    profileIds.map((id, i) => [id, { calls: Number(results[i * 2] ?? 0), sites: Number(results[i * 2 + 1] ?? 0) }]),
  );
}

export async function recordInstall(cloudId: string) {
  const tx = redis.multi();
  tx.hsetnx(`install:${cloudId}`, "firstSeen", now());
  tx.hset(`install:${cloudId}`, { lastSeen: now() });
  await tx.exec();
}
