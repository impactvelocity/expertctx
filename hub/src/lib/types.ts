/** An expert: one person (or, for method packs, one publisher) on the hub. */
export type Expert = {
  id: string;
  slug: string;
  /** Clerk user id. Null for seeded experts nobody has claimed yet. */
  ownerUserId: string | null;
  name: string;
  headline: string;
  bio: string;
  /** Upstash Blob path of the avatar, if one was uploaded. */
  avatarPath: string | null;
  links: { label: string; url: string }[];
  verified: boolean;
  kind: "expert" | "method-pack";
  createdAt: string;
  updatedAt: string;
};

export type Playbook = {
  id: string;
  name: string;
  whenToUse: string;
  steps: string;
  output: string;
};

/** The structured knowledge sections every profile has, in display order. */
export const SECTIONS = [
  {
    key: "frameworks",
    label: "Frameworks",
    hint: "Named methods with their steps. Start each one with a ## heading.",
  },
  {
    key: "rules",
    label: "Rules",
    hint: "Your non-negotiables. One per line: “Always…”, “Never…”.",
  },
  {
    key: "redFlags",
    label: "Red flags",
    hint: "Patterns you spot, and what each one costs the team.",
  },
  {
    key: "examples",
    label: "Examples",
    hint: "Good and bad samples, with your notes on why.",
  },
] as const;

export type SectionKey = (typeof SECTIONS)[number]["key"];

/** One expert profile: a job the expert is good at ("Launch", "Product design"). */
export type Profile = {
  id: string;
  expertId: string;
  title: string;
  tagline: string;
  topics: string[];
  voice: string;
  frameworks: string;
  rules: string;
  redFlags: string;
  examples: string;
  playbooks: Playbook[];
  status: "draft" | "published";
  createdAt: string;
  updatedAt: string;
};

export type SourceKind = "text" | "url" | "file";

export type Source = {
  id: string;
  profileId: string;
  kind: SourceKind;
  title: string;
  url: string | null;
  /** Upstash Blob path for uploaded files. */
  blobPath: string | null;
  /** Pasted text, kept so the source can be re-indexed. */
  text: string | null;
  contentType: string | null;
  size: number | null;
  status: "pending" | "indexed" | "failed";
  chunkCount: number;
  error: string | null;
  createdAt: string;
};

export type ProfileWithExpert = Profile & { expert: Expert };
