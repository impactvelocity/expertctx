"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { deletePrefix, readText } from "@/lib/blob";
import {
  claimExpert,
  createExpert,
  createProfile,
  createSource,
  deleteProfile,
  deleteSource,
  getExpert,
  getExpertByOwner,
  getSource,
  listProfilesForExpert,
  listSources,
  newPlaybook,
  updateExpert,
  updateProfile,
  updateSource,
} from "@/lib/data";
import { requireExpert, requireOwnProfile, requireUserId, isAdmin } from "@/lib/auth";
import { ingestSource } from "@/lib/ingest";
import { knowledgeFor } from "@/lib/knowledge";
import { classifyUrl, LINK_KINDS, normalizeUrl, type LinkKind } from "@/lib/links";
import { fetchLinkMeta } from "@/lib/read/link-meta";
import { deleteSourceChunks, indexDirectory, removeFromDirectory, searchKnowledge, type Excerpt } from "@/lib/vector";
import { SECTIONS, type Playbook, type SourceMeta } from "@/lib/types";

export type ActionResult = { ok: true; message?: string } | { ok: false; message: string };

const text = (max: number) => z.string().trim().max(max);

function fail(error: unknown): ActionResult {
  if (error instanceof z.ZodError) return { ok: false, message: error.issues[0]?.message ?? "Check the form." };
  return { ok: false, message: error instanceof Error ? error.message : "Something went wrong." };
}

/** Keep the public directory in step with a profile's latest content. */
async function syncDirectory(profileId: string) {
  try {
    const { expert, profile } = await requireOwnProfile(profileId);
    await indexDirectory(profile, expert);
  } catch (error) {
    console.error("directory sync failed", error);
  }
}

// ---------------------------------------------------------------------------
// Expert
// ---------------------------------------------------------------------------

const linkSchema = z.object({ label: text(40), url: z.string().trim().url("Links need a full URL") });

const expertSchema = z.object({
  name: text(80).min(2, "Add your name"),
  headline: text(140).min(4, "Add a one-line headline"),
  bio: text(2000),
  links: z.array(linkSchema).max(6).default([]),
});

function parseLinks(raw: FormDataEntryValue | null) {
  return String(raw ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const url = line.match(/https?:\/\/\S+/)?.[0] ?? line;
      const label = line.replace(url, "").replace(/[-–:|]+\s*$/, "").trim() || new URL(url).hostname.replace(/^www\./, "");
      return { label, url };
    });
}

export async function createExpertAction(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  const userId = await requireUserId();
  try {
    if (await getExpertByOwner(userId)) return { ok: false, message: "You already have an expert profile." };
    const input = expertSchema.parse({
      name: form.get("name"),
      headline: form.get("headline"),
      bio: form.get("bio"),
      links: parseLinks(form.get("links")),
    });
    await createExpert(input, userId);
  } catch (error) {
    return fail(error);
  }
  revalidatePath("/studio");
  redirect("/studio");
}

export async function updateExpertAction(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  const { expert } = await requireExpert();
  try {
    const input = expertSchema.parse({
      name: form.get("name"),
      headline: form.get("headline"),
      bio: form.get("bio"),
      links: parseLinks(form.get("links")),
    });
    const next = await updateExpert(expert.id, input);
    // Names and headlines show in the directory, so re-index published profiles.
    for (const profile of await listProfilesForExpert(expert.id)) {
      if (profile.status === "published") after(() => indexDirectory(profile, next).catch(() => {}));
    }
  } catch (error) {
    return fail(error);
  }
  revalidatePath("/studio", "layout");
  revalidatePath(`/experts/${expert.slug}`);
  return { ok: true, message: "Saved" };
}

/** Admins can take over a seeded expert that nobody owns yet. */
export async function claimExpertAction(expertId: string): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!(await isAdmin())) return { ok: false, message: "Only admins can claim seeded experts." };
  try {
    await claimExpert(expertId, userId);
  } catch (error) {
    return fail(error);
  }
  revalidatePath("/studio", "layout");
  return { ok: true, message: "Claimed" };
}

export async function setVerifiedAction(expertId: string, verified: boolean): Promise<ActionResult> {
  await requireUserId();
  if (!(await isAdmin())) return { ok: false, message: "Only admins can verify experts." };
  const expert = await getExpert(expertId);
  if (!expert) return { ok: false, message: "Expert not found" };
  await updateExpert(expertId, { verified });
  revalidatePath("/", "layout");
  return { ok: true, message: verified ? "Verified" : "Verification removed" };
}

// ---------------------------------------------------------------------------
// Profiles
// ---------------------------------------------------------------------------

export async function createProfileAction(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  const { expert } = await requireExpert();
  let id: string;
  try {
    const input = z
      .object({ title: text(60).min(2, "Name the profile, e.g. “Launch”"), tagline: text(160) })
      .parse({ title: form.get("title"), tagline: form.get("tagline") });
    id = (await createProfile(expert, input)).id;
  } catch (error) {
    return fail(error);
  }
  revalidatePath("/studio");
  redirect(`/studio/profiles/${id}`);
}

export async function saveOverviewAction(profileId: string, _: ActionResult | null, form: FormData): Promise<ActionResult> {
  try {
    await requireOwnProfile(profileId);
    const input = z
      .object({
        title: text(60).min(2, "Name the profile"),
        tagline: text(160),
        voice: text(2000),
        topics: z.array(text(40)).max(15),
      })
      .parse({
        title: form.get("title"),
        tagline: form.get("tagline"),
        voice: form.get("voice"),
        topics: String(form.get("topics") ?? "")
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean),
      });
    await updateProfile(profileId, input);
    after(() => syncDirectory(profileId));
  } catch (error) {
    return fail(error);
  }
  revalidatePath(`/studio/profiles/${profileId}`);
  return { ok: true, message: "Saved" };
}

export async function saveKnowledgeAction(profileId: string, _: ActionResult | null, form: FormData): Promise<ActionResult> {
  try {
    await requireOwnProfile(profileId);
    const patch = Object.fromEntries(SECTIONS.map((s) => [s.key, text(30000).parse(form.get(s.key) ?? "")]));
    await updateProfile(profileId, patch);
    after(() => syncDirectory(profileId));
  } catch (error) {
    return fail(error);
  }
  revalidatePath(`/studio/profiles/${profileId}`);
  return { ok: true, message: "Knowledge saved" };
}

const playbookSchema = z.object({
  name: text(80).min(2, "Name the playbook"),
  whenToUse: text(500),
  steps: text(8000).min(2, "Add the steps"),
  output: text(2000),
});

export async function savePlaybookAction(
  profileId: string,
  playbookId: string | null,
  _: ActionResult | null,
  form: FormData,
): Promise<ActionResult> {
  try {
    const { profile } = await requireOwnProfile(profileId);
    const input = playbookSchema.parse({
      name: form.get("name"),
      whenToUse: form.get("whenToUse"),
      steps: form.get("steps"),
      output: form.get("output"),
    });
    const playbooks: Playbook[] = playbookId
      ? profile.playbooks.map((p) => (p.id === playbookId ? { ...p, ...input } : p))
      : [...profile.playbooks, newPlaybook(input)];
    await updateProfile(profileId, { playbooks });
    after(() => syncDirectory(profileId));
  } catch (error) {
    return fail(error);
  }
  revalidatePath(`/studio/profiles/${profileId}`);
  return { ok: true, message: "Playbook saved" };
}

export async function deletePlaybookAction(profileId: string, playbookId: string): Promise<ActionResult> {
  try {
    const { profile } = await requireOwnProfile(profileId);
    await updateProfile(profileId, { playbooks: profile.playbooks.filter((p) => p.id !== playbookId) });
  } catch (error) {
    return fail(error);
  }
  revalidatePath(`/studio/profiles/${profileId}`);
  return { ok: true, message: "Playbook deleted" };
}

export async function setPublishedAction(profileId: string, published: boolean): Promise<ActionResult> {
  try {
    const { expert, profile } = await requireOwnProfile(profileId);
    if (published && !profile.frameworks.trim() && !profile.rules.trim()) {
      return { ok: false, message: "Add some frameworks or rules before publishing." };
    }
    const next = await updateProfile(profileId, { status: published ? "published" : "draft" });
    after(async () => {
      try {
        if (published) await indexDirectory(next, expert);
        else await removeFromDirectory(profileId);
      } catch (error) {
        console.error("directory index failed", error);
      }
    });
  } catch (error) {
    return fail(error);
  }
  revalidatePath("/", "layout");
  return { ok: true, message: published ? "Published. Teams can use this profile now." : "Unpublished" };
}

export async function deleteProfileAction(profileId: string): Promise<ActionResult> {
  try {
    await requireOwnProfile(profileId);
    const removed = await deleteProfile(profileId);
    after(async () => {
      await removeFromDirectory(profileId).catch(() => {});
      for (const sourceId of removed?.sourceIds ?? []) await deleteSourceChunks(sourceId).catch(() => {});
      await deletePrefix(`sources/${profileId}/`);
    });
  } catch (error) {
    return fail(error);
  }
  revalidatePath("/", "layout");
  redirect("/studio");
}

// ---------------------------------------------------------------------------
// Sources: everything the expert drops into a profile's brain
// ---------------------------------------------------------------------------

export type LinkPreview = {
  url: string;
  kind: LinkKind;
  label: string;
  /** What gets read from this kind of link, or null when there is nothing to read. */
  reads: string | null;
  meta: SourceMeta;
  /** Already in this profile. */
  duplicate: boolean;
};

/** A source the signed-in expert owns, or throws. */
async function requireOwnSource(profileId: string, sourceId: string) {
  await requireOwnProfile(profileId);
  const source = await getSource(sourceId);
  if (!source || source.profileId !== profileId) throw new Error("Source not found");
  return source;
}

const urlList = z.array(z.string().trim().url()).min(1).max(12);

/** Titles, thumbnails and types for links in the capture box, before anything is saved. */
export async function previewLinksAction(profileId: string, urls: string[]): Promise<LinkPreview[]> {
  await requireOwnProfile(profileId);
  const parsed = urlList.safeParse(urls);
  if (!parsed.success) return [];
  const existing = new Set((await listSources(profileId)).map((s) => s.url && normalizeUrl(s.url)));
  return Promise.all(
    parsed.data.map(async (raw) => {
      const url = normalizeUrl(raw);
      const kind = classifyUrl(url);
      return {
        url,
        kind,
        label: LINK_KINDS[kind].label,
        reads: LINK_KINDS[kind].reads,
        meta: await fetchLinkMeta(url),
        duplicate: existing.has(url),
      };
    }),
  );
}

export async function addLinksAction(profileId: string, items: { url: string; mode: "read" | "link" }[]): Promise<ActionResult> {
  try {
    await requireOwnProfile(profileId);
    const input = z
      .array(z.object({ url: z.string().trim().url("Enter a full URL, starting with https://"), mode: z.enum(["read", "link"]) }))
      .min(1)
      .max(12)
      .parse(items);
    const existing = new Set((await listSources(profileId)).map((s) => s.url && normalizeUrl(s.url)));

    let added = 0;
    for (const item of input) {
      const url = normalizeUrl(item.url);
      if (existing.has(url)) continue;
      existing.add(url);
      const kind = classifyUrl(url);
      // Nothing to read on a profile page, so it is always kept as a link.
      const mode = LINK_KINDS[kind].reads ? item.mode : "link";
      // Usually cached by the preview a moment ago, so cards have a title and thumbnail at once.
      const meta = await fetchLinkMeta(url).catch(() => null);
      const source = await createSource({
        profileId,
        kind: "url",
        type: mode === "link" ? "link" : LINK_KINDS[kind].type,
        mode,
        title: meta?.title || url,
        url,
        blobPath: null,
        text: null,
        contentType: null,
        size: null,
        meta,
        stage: mode === "link" ? "Saving the link" : kind === "youtube" ? "Fetching the transcript" : "Reading the page",
      });
      after(() => ingestSource(source.id));
      added += 1;
    }
    if (!added) return { ok: false, message: input.length > 1 ? "Those are already in this brain." : "That's already in this brain." };
    revalidatePath(`/studio/profiles/${profileId}`);
    return { ok: true, message: added > 1 ? `Added ${added} links. Reading them now.` : "Added. Reading it now." };
  } catch (error) {
    return fail(error);
  }
}

export async function addNoteAction(profileId: string, note: { title: string; text: string }): Promise<ActionResult> {
  try {
    await requireOwnProfile(profileId);
    const input = z
      .object({ title: text(120), text: text(200_000).min(20, "Write a sentence or two, or paste a link") })
      .parse(note);
    const firstLine = input.text.split("\n").find((line) => line.trim())?.replace(/^#+\s*/, "").trim() ?? "";
    const source = await createSource({
      profileId,
      kind: "text",
      type: "note",
      title: input.title || (firstLine.length > 70 ? `${firstLine.slice(0, 67).trimEnd()}…` : firstLine) || "Note",
      url: null,
      blobPath: null,
      text: input.text,
      contentType: "text/markdown",
      size: input.text.length,
      stage: "Filing passages",
    });
    after(() => ingestSource(source.id));
  } catch (error) {
    return fail(error);
  }
  revalidatePath(`/studio/profiles/${profileId}`);
  return { ok: true, message: "Note added." };
}

export async function renameSourceAction(profileId: string, sourceId: string, title: string): Promise<ActionResult> {
  try {
    const source = await requireOwnSource(profileId, sourceId);
    const next = text(160).min(1, "Give it a title").parse(title);
    if (next !== source.title) {
      await updateSource(sourceId, { title: next });
      // Passages carry the title for citations, so they are re-filed under the new one.
      if (source.status === "indexed") after(() => ingestSource(sourceId));
    }
  } catch (error) {
    return fail(error);
  }
  revalidatePath(`/studio/profiles/${profileId}`);
  return { ok: true, message: "Renamed" };
}

/** Turn a link that was only kept as a reference into one that is read. */
export async function readLinkAction(profileId: string, sourceId: string): Promise<ActionResult> {
  try {
    const source = await requireOwnSource(profileId, sourceId);
    if (!source.url) return { ok: false, message: "This source has no link to read." };
    const kind = classifyUrl(source.url);
    await updateSource(sourceId, {
      mode: "read",
      type: LINK_KINDS[kind].type === "link" ? "article" : LINK_KINDS[kind].type,
      status: "pending",
      error: null,
      stage: "Reading the page",
    });
    after(() => ingestSource(sourceId));
  } catch (error) {
    return fail(error);
  }
  revalidatePath(`/studio/profiles/${profileId}`);
  return { ok: true, message: "Reading it now" };
}

/** The full text that was read from a source, for the detail view. */
export async function sourceTextAction(profileId: string, sourceId: string): Promise<{ ok: boolean; text: string }> {
  try {
    const source = await requireOwnSource(profileId, sourceId);
    if (source.text) return { ok: true, text: source.text };
    if (source.textPath) return { ok: true, text: (await readText(source.textPath)).slice(0, 120_000) };
    return { ok: true, text: "" };
  } catch {
    return { ok: false, text: "" };
  }
}

/** Recall: the passages this brain would hand the agent for a question. */
export async function askBrainAction(profileId: string, question: string): Promise<{ ok: boolean; excerpts: Excerpt[]; message?: string }> {
  try {
    await requireOwnProfile(profileId);
    const query = question.trim().slice(0, 500);
    if (!query) return { ok: true, excerpts: [] };
    return { ok: true, excerpts: await searchKnowledge(profileId, query, 6) };
  } catch (error) {
    console.error("recall failed", error);
    return { ok: false, excerpts: [], message: "Recall is unavailable right now." };
  }
}

export async function reindexSourceAction(profileId: string, sourceId: string): Promise<ActionResult> {
  try {
    await requireOwnSource(profileId, sourceId);
    await updateSource(sourceId, { status: "pending", error: null, stage: "Reading again" });
    after(() => ingestSource(sourceId));
  } catch (error) {
    return fail(error);
  }
  revalidatePath(`/studio/profiles/${profileId}`);
  return { ok: true, message: "Reading it again" };
}

export async function deleteSourceAction(profileId: string, sourceId: string): Promise<ActionResult> {
  try {
    await requireOwnSource(profileId, sourceId);
    await deleteSource(sourceId);
    after(async () => {
      await deleteSourceChunks(sourceId).catch(() => {});
      await deletePrefix(`sources/${profileId}/${sourceId}/`);
    });
  } catch (error) {
    return fail(error);
  }
  revalidatePath(`/studio/profiles/${profileId}`);
  return { ok: true, message: "Removed from your brain" };
}

// ---------------------------------------------------------------------------
// Preview
// ---------------------------------------------------------------------------

export async function previewAction(profileId: string, question: string) {
  const { expert, profile } = await requireOwnProfile(profileId);
  return knowledgeFor(profile, expert, question.slice(0, 2000));
}
