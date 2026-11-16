import { auth } from "@clerk/nextjs/server";
import { nanoid } from "nanoid";
import { deleteFile, putFile } from "@/lib/blob";
import { getExpertByOwner, updateExpert } from "@/lib/data";

const TYPES: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ ok: false, message: "Sign in first." }, { status: 401 });
  const expert = await getExpertByOwner(userId);
  if (!expert) return Response.json({ ok: false, message: "Create your expert profile first." }, { status: 404 });

  const file = (await request.formData()).get("file");
  if (!(file instanceof File)) return Response.json({ ok: false, message: "Choose an image." }, { status: 400 });
  const ext = TYPES[file.type];
  if (!ext) return Response.json({ ok: false, message: "Use a PNG, JPEG or WebP image." }, { status: 415 });
  if (file.size > 2 * 1024 * 1024) return Response.json({ ok: false, message: "Images can be up to 2 MB." }, { status: 413 });

  const path = `avatars/${expert.id}/${nanoid(10)}.${ext}`;
  await putFile(path, await file.arrayBuffer(), file.type);
  if (expert.avatarPath) await deleteFile(expert.avatarPath);
  await updateExpert(expert.id, { avatarPath: path });
  return Response.json({ ok: true });
}
