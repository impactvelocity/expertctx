import "server-only";
import { auth } from "@clerk/nextjs/server";
import { BlobError, uploadHandler } from "@upstash/blob";
import { after } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { createSource, getExpertByOwner, getProfile } from "./data";
import { describeFile, MAX_MEDIA_BYTES } from "./files";
import { ingestSource } from "./ingest";

/**
 * Direct browser uploads for source files. The bytes go straight to Upstash
 * Blob, so a two-hour recording isn't stopped by the platform's request size
 * limit. This route only authorizes the upload and files the source afterwards.
 */
export const uploads = uploadHandler({
  constraints: { maxSize: MAX_MEDIA_BYTES },
  input: z.object({ profileId: z.string().min(1).max(120), title: z.string().trim().max(160).optional() }),

  onBeforeUpload: async ({ file, input }) => {
    const { userId } = await auth();
    if (!userId) throw new BlobError("unauthorized", { message: "Sign in first." });
    const [expert, profile] = await Promise.all([getExpertByOwner(userId), getProfile(input.profileId)]);
    if (!expert || !profile || profile.expertId !== expert.id) throw new BlobError("forbidden", { message: "Profile not found." });

    const described = describeFile(file);
    if (!described.ok) throw new BlobError("content_type_not_allowed", { message: described.message });

    const sourceId = nanoid(12);
    const safeName = file.name.replace(/[^\w.-]+/g, "-").slice(-80) || "file";
    return {
      path: `sources/${profile.id}/${sourceId}/${safeName}`,
      state: {
        sourceId,
        profileId: profile.id,
        title: input.title || described.title,
        contentType: described.contentType,
        type: described.type,
      },
    };
  },

  onUploadComplete: async ({ path, size, state }) => {
    const source = await createSource({
      id: state.sourceId,
      profileId: state.profileId,
      kind: "file",
      type: state.type,
      title: state.title,
      url: null,
      blobPath: path,
      text: null,
      contentType: state.contentType,
      size,
      stage: state.type === "audio" || state.type === "video" ? "Transcribing" : "Reading the file",
    });
    after(() => ingestSource(source.id));
    return { sourceId: source.id };
  },
});
