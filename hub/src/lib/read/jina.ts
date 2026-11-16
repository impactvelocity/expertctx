import "server-only";

/**
 * Jina Reader: how the hub turns a web page into readable Markdown.
 *
 * Sends JINA_API_KEY when it is set. Without a key the endpoint still works,
 * but is capped at 20 requests a minute for the whole hub.
 *
 * Never throws: an unreadable page comes back as `ok: false`, so the caller
 * can fall back to another reader.
 */
export async function readWithJina(url: string): Promise<{ ok: boolean; text: string; title: string; status: number }> {
  // Images are dropped: their URLs and alt text are noise in a passage.
  const headers: Record<string, string> = { "X-Return-Format": "markdown", "X-Retain-Images": "none" };
  if (process.env.JINA_API_KEY) headers.Authorization = `Bearer ${process.env.JINA_API_KEY}`;

  try {
    const response = await fetch(`https://r.jina.ai/${url}`, { headers, signal: AbortSignal.timeout(45_000) });
    if (!response.ok) return { ok: false, text: "", title: "", status: response.status };
    const raw = await response.text();
    const { title, body } = splitPreamble(raw);
    return { ok: body.trim().length > 0, text: body.trim(), title, status: response.status };
  } catch {
    return { ok: false, text: "", title: "", status: 0 };
  }
}

/**
 * Jina can open its answer with "Title: … / URL Source: … / Markdown Content:".
 * The title is useful; the rest of the preamble is noise in a passage.
 */
function splitPreamble(raw: string): { title: string; body: string } {
  const head = raw.slice(0, 2000);
  const title = /^Title:\s*(.+)$/m.exec(head)?.[1].trim() ?? "";
  const marker = head.indexOf("Markdown Content:");
  if (marker >= 0) return { title, body: raw.slice(marker + "Markdown Content:".length) };
  // No marker: drop any leading "Key: value" lines.
  const body = raw.replace(/^(?:(?:Title|URL Source|Published Time|Warning):.*\n+)+/i, "");
  return { title, body };
}
