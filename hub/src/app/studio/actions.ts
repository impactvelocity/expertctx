"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { deleteFile, deletePrefix } from "@/lib/blob";
import {
  claimExpert,
  createExpert,
  createProfile,
  createSource,
  deleteProfile,
  deleteSource,
  getExpert,
  getExpertByOwner,
  listProfilesForExpert,
  newPlaybook,
  updateExpert,
  updateProfile,
} from "@/lib/data";
import { requireExpert, requireOwnProfile, requireUserId, isAdmin } from "@/lib/auth";
import { ingestSource } from "@/lib/ingest";
import { knowledgeFor } from "@/lib/knowledge";
import { deleteSourceChunks, indexDirectory, removeFromDirectory } from "@/lib/vector";
import { SECTIONS, type Playbook } from "@/lib/types";

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
// Sources
// ---------------------------------------------------------------------------

export async function addTextSourceAction(profileId: string, _: ActionResult | null, form: FormData): Promise<ActionResult> {
  try {
    await requireOwnProfile(profileId);
    const input = z
      .object({ title: text(120).min(2, "Give the source a title"), text: text(200_000).min(40, "Paste at least a paragraph") })
      .parse({ title: form.get("title"), text: form.get("text") });
    const source = await createSource({
      profileId,
      kind: "text",
      title: input.title,
      url: null,
      blobPath: null,
      text: input.text,
      contentType: "text/markdown",
      size: input.text.length,
    });
    after(() => ingestSource(source.id));
  } catch (error) {
    return fail(error);
  }
  revalidatePath(`/studio/profiles/${profileId}`);
  return { ok: true, message: "Added. Indexing now." };
}

export async function addUrlSourceAction(profileId: string, _: ActionResult | null, form: FormData): Promise<ActionResult> {
  try {
    await requireOwnProfile(profileId);
    const input = z
      .object({ url: z.string().trim().url("Enter a full URL, starting with https://"), title: text(120) })
      .parse({ url: form.get("url"), title: form.get("title") });
    const source = await createSource({
      profileId,
      kind: "url",
      title: input.title || input.url,
      url: input.url,
      blobPath: null,
      text: null,
      contentType: null,
      size: null,
    });
    after(() => ingestSource(source.id));
  } catch (error) {
    return fail(error);
  }
  revalidatePath(`/studio/profiles/${profileId}`);
  return { ok: true, message: "Added. Reading the page now." };
}

export async function reindexSourceAction(profileId: string, sourceId: string): Promise<ActionResult> {
  try {
    await requireOwnProfile(profileId);
    const { updateSource } = await import("@/lib/data");
    await updateSource(sourceId, { status: "pending", error: null });
    after(() => ingestSource(sourceId));
  } catch (error) {
    return fail(error);
  }
  revalidatePath(`/studio/profiles/${profileId}`);
  return { ok: true, message: "Indexing again" };
}

export async function deleteSourceAction(profileId: string, sourceId: string): Promise<ActionResult> {
  try {
    await requireOwnProfile(profileId);
    const source = await deleteSource(sourceId);
    after(async () => {
      await deleteSourceChunks(sourceId).catch(() => {});
      if (source?.blobPath) await deleteFile(source.blobPath);
    });
  } catch (error) {
    return fail(error);
  }
  revalidatePath(`/studio/profiles/${profileId}`);
  return { ok: true, message: "Source deleted" };
}

// ---------------------------------------------------------------------------
// Preview
// ---------------------------------------------------------------------------

export async function previewAction(profileId: string, question: string) {
  const { expert, profile } = await requireOwnProfile(profileId);
  return knowledgeFor(profile, expert, question.slice(0, 2000));
}
