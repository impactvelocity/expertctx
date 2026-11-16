import { auth } from "@clerk/nextjs/server";
import { after } from "next/server";
import { nanoid } from "nanoid";
import { putFile } from "@/lib/blob";
import { createSource, getExpertByOwner, getProfile } from "@/lib/data";
import { ingestSource } from "@/lib/ingest";

const MAX_BYTES = 4 * 1024 * 1024; // under Vercel's 4.5 MB request body limit
const TYPES: Record<string, string> = {
  pdf: "application/pdf",
  md: "text/markdown",
  markdown: "text/markdown",
  txt: "text/plain",
};

/** Upload a source file (PDF, Markdown or text) to a profile, then index it. */
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ ok: false, message: "Sign in first." }, { status: 401 });

  const form = await request.formData();
  const profileId = String(form.get("profileId") ?? "");
  const file = form.get("file");
  const expert = await getExpertByOwner(userId);
  const profile = await getProfile(profileId);
  if (!expert || !profile || profile.expertId !== expert.id) {
    return Response.json({ ok: false, message: "Profile not found." }, { status: 404 });
  }
  if (!(file instanceof File)) return Response.json({ ok: false, message: "Choose a file." }, { status: 400 });
  if (file.size > MAX_BYTES) return Response.json({ ok: false, message: "Files can be up to 4 MB." }, { status: 413 });

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const contentType = TYPES[extension];
  if (!contentType) return Response.json({ ok: false, message: "Upload a PDF, Markdown or text file." }, { status: 415 });

  const sourceId = nanoid(12);
  const safeName = file.name.replace(/[^\w.-]+/g, "-").slice(0, 80) || `file.${extension}`;
  const blobPath = `sources/${profile.id}/${sourceId}/${safeName}`;
  await putFile(blobPath, await file.arrayBuffer(), contentType);

  const title = String(form.get("title") ?? "").trim() || file.name.replace(/\.[^.]+$/, "");
  const source = await createSource({
    id: sourceId,
    profileId: profile.id,
    kind: "file",
    title,
    url: null,
    blobPath,
    text: null,
    contentType,
    size: file.size,
  });
  after(() => ingestSource(source.id));
  return Response.json({ ok: true, source });
}
