import "server-only";
import { Bucket } from "@upstash/blob";

/**
 * All Upstash Blob calls live here, so the pre-1.0 SDK can be swapped for
 * plain S3 calls in one file if we ever need to.
 */
let bucket: Bucket | null = null;
function getBucket() {
  bucket ??= Bucket.fromEnv();
  return bucket;
}

export async function putFile(path: string, body: Blob | ArrayBuffer | Uint8Array, contentType: string) {
  await getBucket().put(path, body as Blob, { contentType });
  return path;
}

export async function readFile(path: string): Promise<ArrayBuffer> {
  const record = await getBucket().get(path);
  return new Response(record.body as ReadableStream).arrayBuffer();
}

export async function putText(path: string, text: string) {
  await getBucket().put(path, text, { contentType: "text/markdown; charset=utf-8" });
  return path;
}

export async function readText(path: string): Promise<string> {
  return new TextDecoder().decode(await readFile(path));
}

/** A short-lived link for reading a private object (or its public URL). */
export async function fileUrl(path: string): Promise<string> {
  const b = getBucket();
  const publicUrl = await b.publicUrl(path);
  if (publicUrl) return publicUrl;
  const { url } = await b.signedReadUrl(path);
  if (!url) throw new Error("Could not sign a read URL");
  return url;
}

export async function deleteFile(path: string) {
  try {
    await getBucket().del(path);
  } catch (error) {
    console.error("blob delete failed", path, error);
  }
}

export async function deletePrefix(prefix: string) {
  try {
    await getBucket().del({ prefix });
  } catch (error) {
    console.error("blob prefix delete failed", prefix, error);
  }
}
