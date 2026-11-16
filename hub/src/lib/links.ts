import type { SourceType } from "./types";

/**
 * Link handling shared by the capture box (browser) and ingestion (server):
 * pulling URLs out of whatever was pasted, and deciding what each one is so
 * the UI never asks the expert to pick a type.
 */

export type LinkKind =
  | "youtube"
  | "tiktok"
  | "instagram"
  | "x"
  | "linkedin"
  | "profile" // a channel or social profile page: nothing to read, worth keeping as a link
  | "pdf"
  | "web";

const SOCIAL_HOSTS = [
  "youtube.com",
  "youtu.be",
  "instagram.com",
  "tiktok.com",
  "twitter.com",
  "x.com",
  "facebook.com",
  "linkedin.com",
  "threads.net",
  "threads.com",
  "twitch.tv",
  "discord.gg",
  "discord.com",
  "t.me",
  "snapchat.com",
  "pinterest.com",
  "spotify.com",
  "podcasts.apple.com",
];

const BARE_DOMAIN = /^(?:www\.)?(?:[a-z0-9-]+\.)+[a-z]{2,24}(?:[/?#]\S*)?$/i;

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return "";
  }
}

const onHost = (host: string, candidates: string[]) => candidates.some((c) => host === c || host.endsWith(`.${c}`));

/** A full https URL from what someone typed ("example.com/post" counts), or null. */
export function toUrl(raw: string): string | null {
  const value = raw.trim().replace(/^[<(["']+|[>)\]"',.;]+$/g, "");
  if (!value || /\s/.test(value)) return null;
  const candidate = /^https?:\/\//i.test(value) ? value : BARE_DOMAIN.test(value) ? `https://${value}` : null;
  if (!candidate) return null;
  try {
    const url = new URL(candidate);
    if (!url.hostname.includes(".")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

/** Strip tracking parameters and fragments so the same page pasted twice is one link. */
export function normalizeUrl(raw: string): string {
  try {
    const url = new URL(raw);
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_|fbclid|gclid|mc_eid|mc_cid|igshid|ref$|si$|feature$)/i.test(key)) url.searchParams.delete(key);
    }
    url.hash = "";
    let out = url.toString();
    if (url.pathname === "/" && !url.search) out = out.replace(/\/$/, "");
    return out;
  } catch {
    return raw;
  }
}

export type Capture =
  | { kind: "empty" }
  | { kind: "links"; urls: string[] }
  | { kind: "note"; text: string };

/**
 * What the capture box holds. Only links (one or many) means "add these
 * links"; anything with prose around it is a note.
 */
export function parseCapture(input: string): Capture {
  const text = input.trim();
  if (!text) return { kind: "empty" };
  const tokens = text.split(/\s+/);
  const urls = tokens.map(toUrl);
  if (urls.every(Boolean)) {
    return { kind: "links", urls: [...new Set(urls.map((u) => normalizeUrl(u as string)))].slice(0, 12) };
  }
  return { kind: "note", text };
}

export function youtubeId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^(www|m|music)\./, "");
    if (host === "youtu.be") return u.pathname.slice(1).split("/")[0] || null;
    if (host !== "youtube.com" && host !== "youtube-nocookie.com") return null;
    if (u.pathname === "/watch") return u.searchParams.get("v");
    const match = /^\/(?:shorts|live|embed|v)\/([\w-]{6,})/.exec(u.pathname);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

export function classifyUrl(url: string): LinkKind {
  const host = hostOf(url);
  let path = "";
  try {
    path = new URL(url).pathname;
  } catch {
    return "web";
  }
  if (onHost(host, ["youtube.com", "youtu.be"])) return youtubeId(url) ? "youtube" : "profile";
  if (onHost(host, ["tiktok.com"])) return /\/video\/\d+/.test(path) || /^(vm|vt)\./.test(host) || /^\/t\//.test(path) ? "tiktok" : "profile";
  if (onHost(host, ["instagram.com"])) return /^\/(?:[^/]+\/)?(p|reel|reels|tv)\//.test(path) ? "instagram" : "profile";
  if (onHost(host, ["x.com", "twitter.com"])) return /\/status\/\d+/.test(path) ? "x" : "profile";
  if (onHost(host, ["linkedin.com"])) return /^\/(posts|pulse|feed\/update)\//.test(path) ? "linkedin" : "profile";
  if (onHost(host, SOCIAL_HOSTS)) return "profile";
  if (/\.pdf$/i.test(path)) return "pdf";
  return "web";
}

/** How each kind of link shows up in the brain, and whether there is anything to read. */
export const LINK_KINDS: Record<LinkKind, { label: string; type: SourceType; reads: string | null }> = {
  youtube: { label: "YouTube", type: "youtube", reads: "Transcript" },
  tiktok: { label: "TikTok", type: "social", reads: "Transcript" },
  instagram: { label: "Instagram", type: "social", reads: "Transcript" },
  x: { label: "X post", type: "social", reads: "Post" },
  linkedin: { label: "LinkedIn", type: "social", reads: "Post" },
  profile: { label: "Profile", type: "link", reads: null },
  pdf: { label: "PDF", type: "pdf", reads: "Every page" },
  web: { label: "Web page", type: "article", reads: "Full page" },
};

/** Hosts a server-side fetch must never reach. */
export function isPublicUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (!/^https?:$/.test(u.protocol)) return false;
    const host = u.hostname.toLowerCase();
    if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) return false;
    if (host.startsWith("[")) return false; // IPv6 literals
    if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
      const [a, b] = host.split(".").map(Number);
      if (a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)) {
        return false;
      }
    }
    return host.includes(".");
  } catch {
    return false;
  }
}

/** "12:34" or "1:02:03" from seconds. */
export function clock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const rest = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${rest}` : `${m}:${rest}`;
}
