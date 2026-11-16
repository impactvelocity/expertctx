import "server-only";
import { classifyUrl, hostOf, isPublicUrl } from "../links";
import { redis } from "../redis";
import type { SourceMeta } from "../types";

const EMPTY: SourceMeta = { title: "", description: "", image: "", icon: "", site: "", author: "" };

const decode = (value: string) =>
  value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/\s+/g, " ")
    .trim();

/** YouTube's public oEmbed endpoint: title, channel and thumbnail, no key needed. */
async function youtubeMeta(url: string): Promise<Partial<SourceMeta> | null> {
  try {
    const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`, {
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return null;
    const body = (await response.json()) as { title?: string; author_name?: string; thumbnail_url?: string };
    return {
      title: body.title ?? "",
      author: body.author_name ?? "",
      image: body.thumbnail_url ?? "",
      site: "YouTube",
      icon: "https://www.youtube.com/s/desktop/favicon_48x48.png",
    };
  } catch {
    return null;
  }
}

type Iframely = {
  /** Set, with a `status`, when iframe.ly couldn't fetch the page; `title` then holds the error. */
  error?: string;
  status?: number;
  title?: string;
  description?: string;
  meta?: { title?: string; description?: string; site?: string; author?: string };
  links?: { thumbnail?: { href?: string }[]; icon?: { href?: string }[] };
};

/** iframe.ly, when IFRAMELY_API_KEY is set: the best previews, including sites that block scrapers. */
async function iframelyMeta(url: string): Promise<Partial<SourceMeta> | null> {
  const key = process.env.IFRAMELY_API_KEY;
  if (!key) return null;
  try {
    // iframe.ly takes the account key as `api_key`, or its MD5 hash (32 hex characters) as `key`.
    const param = /^[a-f0-9]{32}$/i.test(key) ? "key" : "api_key";
    const response = await fetch(`https://iframe.ly/api/iframely?url=${encodeURIComponent(url)}&${param}=${encodeURIComponent(key)}`, {
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return null;
    const raw = (await response.json()) as Iframely;
    if (raw.error || (raw.status ?? 200) >= 400) return null;
    return {
      title: raw.title || raw.meta?.title || "",
      description: raw.meta?.description || raw.description || "",
      image: raw.links?.thumbnail?.[0]?.href || "",
      icon: raw.links?.icon?.[0]?.href || "",
      site: raw.meta?.site || "",
      author: raw.meta?.author || "",
    };
  } catch {
    return null;
  }
}

/** The page's own Open Graph tags, read from the first part of its HTML. */
async function pageMeta(url: string): Promise<Partial<SourceMeta> | null> {
  if (!isPublicUrl(url)) return null;
  try {
    const response = await fetch(url, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; ExpertCTX-Hub/1.0; +link preview)", accept: "text/html,*/*" },
      redirect: "follow",
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok || !(response.headers.get("content-type") ?? "").includes("html")) return null;
    const html = (await response.text()).slice(0, 400_000);
    const head = html.slice(0, html.search(/<\/head>/i) > 0 ? html.search(/<\/head>/i) : 150_000);

    const tags = new Map<string, string>();
    for (const tag of head.match(/<meta\b[^>]*>/gi) ?? []) {
      const name = /\b(?:property|name)\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1]?.toLowerCase();
      const content = /\bcontent\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(tag);
      if (name && content && !tags.has(name)) tags.set(name, decode(content[1] ?? content[2] ?? ""));
    }
    const pick = (...names: string[]) => names.map((n) => tags.get(n)).find(Boolean) ?? "";
    const absolute = (value: string) => {
      try {
        return value ? new URL(value, response.url).toString() : "";
      } catch {
        return "";
      }
    };
    const iconTag = (head.match(/<link\b[^>]*>/gi) ?? []).find((tag) => /\brel\s*=\s*["'][^"']*\bicon\b/i.test(tag));
    const iconHref = iconTag ? /\bhref\s*=\s*["']([^"']+)["']/i.exec(iconTag)?.[1] : null;

    return {
      title: pick("og:title", "twitter:title") || decode(/<title[^>]*>([^<]*)<\/title>/i.exec(head)?.[1] ?? ""),
      description: pick("og:description", "twitter:description", "description"),
      image: absolute(pick("og:image", "og:image:url", "twitter:image", "twitter:image:src")),
      icon: absolute(iconHref ?? "/favicon.ico"),
      site: pick("og:site_name", "application-name"),
      author: pick("author", "article:author", "twitter:creator").replace(/^https?:\/\/\S+$/, ""),
    };
  } catch {
    return null;
  }
}

const useful = (meta: Partial<SourceMeta> | null): meta is Partial<SourceMeta> => Boolean(meta?.title);

/**
 * Title, description, thumbnail and favicon for a link. Cached for a day, so
 * the preview in the capture box and the saved source agree without a second
 * lookup. Always answers: a link nothing can describe gets its hostname.
 */
export async function fetchLinkMeta(url: string): Promise<SourceMeta> {
  const cacheKey = `linkmeta:${url}`;
  try {
    const cached = await redis.get<SourceMeta>(cacheKey);
    if (cached) return cached;
  } catch {
    // The cache is a convenience; look it up fresh.
  }

  const host = hostOf(url);
  let found: Partial<SourceMeta> | null = classifyUrl(url) === "youtube" ? await youtubeMeta(url) : null;
  if (!useful(found)) found = await iframelyMeta(url);
  if (!useful(found)) found = await pageMeta(url);

  const meta: SourceMeta = { ...EMPTY, ...(found ?? {}) };
  meta.site ||= host;
  meta.icon ||= host ? `https://${host}/favicon.ico` : "";
  for (const key of Object.keys(meta) as (keyof SourceMeta)[]) meta[key] = String(meta[key] ?? "").slice(0, key === "description" ? 400 : 300);

  if (useful(found)) {
    try {
      await redis.set(cacheKey, meta, { ex: 86_400 });
    } catch {
      // Not cached; the next lookup does the work again.
    }
  }
  return meta;
}
