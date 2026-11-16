import "server-only";
import { getExpert, listPublishedProfiles } from "./data";
import { frameworkNames, searchDirectory, searchKnowledge, type Excerpt } from "./vector";
import { SECTIONS, type Expert, type Profile, type ProfileWithExpert } from "./types";

/**
 * Find a published profile from whatever the agent or a person typed: an id,
 * a title ("Launch"), an expert name ("Dylan") or both ("Dylan's Launch
 * profile"). Word matching first, since names and titles are exact; the
 * vector directory breaks ties and catches paraphrases ("go-to-market").
 */
export type Resolution =
  | { match: ProfileWithExpert }
  | { match: null; candidates: ProfileWithExpert[] };

/**
 * The agent often sends just the expert's name ("Dylan Jones"), which matches
 * every profile they have. Then the user's question ("…with the Launch
 * profile") breaks the tie; if it can't, we hand back the candidates so the
 * agent asks instead of guessing.
 */
export async function resolveProfile(query: string | undefined, hint = ""): Promise<Resolution> {
  const profiles = await listPublishedProfiles();
  const q = query?.trim() ?? "";
  const exact = profiles.find((p) => p.id === q);
  if (exact) return { match: exact };

  let candidates = q ? topTied(keywordRank(profiles, q)) : profiles;
  if (candidates.length > 1 && hint) {
    const narrowed = topTied(keywordRank(candidates, hint));
    if (narrowed.length) candidates = narrowed;
  }
  if (candidates.length === 1) return { match: candidates[0] };
  if (candidates.length > 1) return { match: null, candidates };

  // No word matched: try meaning ("go-to-market" → Launch).
  try {
    const hits = await searchDirectory([q, hint].filter(Boolean).join("\n"), 5);
    const best = hits.find((h) => h.score > 0.5);
    const match = best && profiles.find((p) => p.id === best.id);
    if (match) return { match };
  } catch {
    // No embedding model on the index yet: keyword matching is all we have.
  }
  return { match: null, candidates: [] };
}

function topTied(ranked: { profile: ProfileWithExpert; score: number }[]) {
  const top = ranked[0]?.score ?? 0;
  return top ? ranked.filter((r) => r.score === top).map((r) => r.profile) : [];
}

function keywordRank(profiles: ProfileWithExpert[], query: string) {
  const words = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2 && !["profile", "expert", "the", "and", "with"].includes(w));
  return profiles
    .map((profile) => {
      const title = profile.title.toLowerCase();
      const haystack = [profile.title, profile.expert.name, profile.tagline, profile.topics.join(" ")]
        .join(" ")
        .toLowerCase();
      // The title counts double: "launch" should pick the Launch profile even
      // if another profile mentions launches in passing.
      const score = words.reduce((sum, w) => sum + (title.includes(w) ? 2 : haystack.includes(w) ? 1 : 0), 0);
      return { profile, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
}

/** Directory search for the marketplace: meaning first, keywords as fallback. */
export async function searchProfiles(query: string, topic?: string): Promise<ProfileWithExpert[]> {
  let profiles = await listPublishedProfiles();
  if (topic) profiles = profiles.filter((p) => p.topics.some((t) => t.toLowerCase() === topic.toLowerCase()));
  if (!query.trim()) return profiles;
  try {
    const hits = await searchDirectory(query, 30);
    const order = new Map(hits.filter((h) => h.score > 0.3).map((h, i) => [h.id, i]));
    const ranked = profiles.filter((p) => order.has(p.id)).sort((a, b) => order.get(a.id)! - order.get(b.id)!);
    if (ranked.length) return ranked;
  } catch {
    // fall through to keywords
  }
  return keywordRank(profiles, query).map((r) => r.profile);
}

export function profileSummary(p: ProfileWithExpert) {
  return {
    id: p.id,
    expert: p.expert.name,
    expertSlug: p.expert.slug,
    verified: p.expert.verified,
    profile: p.title,
    tagline: p.tagline,
    topics: p.topics,
    frameworks: frameworkNames(p.frameworks),
    playbooks: p.playbooks.map((pb) => pb.name),
  };
}

/**
 * What the Rovo agent gets for one question: the profile's structured
 * knowledge in full (it's short, and it's the expert's judgment), every
 * playbook, and the source excerpts that best match the question.
 */
export async function knowledgeFor(profile: Profile, expert: Expert, question: string) {
  let excerpts: Excerpt[] = [];
  let excerptNote: string | undefined;
  try {
    excerpts = await searchKnowledge(profile.id, question || profile.title);
  } catch (error) {
    excerptNote = "Source search is unavailable right now; answer from the structured knowledge.";
    console.error("knowledge search failed", error);
  }

  return {
    ok: true,
    id: profile.id,
    expert: expert.name,
    verified: expert.verified,
    headline: expert.headline,
    profile: profile.title,
    tagline: profile.tagline,
    bio: expert.bio,
    voice: profile.voice,
    knowledge: Object.fromEntries(SECTIONS.map((s) => [s.label, profile[s.key]])),
    playbooks: profile.playbooks.map((p) => ({
      name: p.name,
      whenToUse: p.whenToUse,
      steps: p.steps,
      output: p.output,
    })),
    sourceExcerpts: excerpts.map((e) => ({
      source: e.source,
      where: e.locator,
      url: e.url,
      text: e.text,
    })),
    howToCite:
      `Cite the expert's frameworks by name ("${expert.name}'s *Framework name*") and source excerpts by ` +
      `title and where ("${expert.name}, *Source title*, Page 4"). Cite the team's pages by their titles.`,
    ...(excerptNote ? { note: excerptNote } : {}),
  };
}

export async function knowledgeForQuery(expertQuery: string | undefined, question: string) {
  const { match, ...rest } = await resolveProfile(expertQuery, question);
  console.log("knowledge resolve", JSON.stringify({ expertQuery, matched: match?.id ?? null }));
  if (!match) {
    const candidates = "candidates" in rest && rest.candidates.length ? rest.candidates : await listPublishedProfiles();
    const several = "candidates" in rest && rest.candidates.length > 1;
    return {
      profileId: null,
      payload: {
        ok: false as const,
        message: several
          ? `${candidates[0].expert.name} has several profiles. Ask the user which one they want, or call again with the profile id.`
          : "No expert profile matches. Ask the user which expert they mean.",
        available: candidates.map((p) => `${p.expert.name}: ${p.title} (id: ${p.id})`),
      },
    };
  }
  const expert = (await getExpert(match.expertId)) ?? match.expert;
  return { profileId: match.id, payload: await knowledgeFor(match, expert, question) };
}
