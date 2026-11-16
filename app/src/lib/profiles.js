/**
 * Bundled expert profiles: a read-only fallback for when the ExpertCTX hub
 * can't be reached, so a demo never breaks. The live profiles, and the place
 * experts edit them, are on the hub. Nothing here is stored or editable on
 * the site, so nobody can claim or change these.
 */
import { SEED_PROFILES } from '../seed/profiles';

/** The knowledge sections every profile has, in display order. */
export const SECTIONS = [
  { key: 'frameworks', label: 'Frameworks' },
  { key: 'rules', label: 'Rules' },
  { key: 'redFlags', label: 'Red flags' },
  { key: 'examples', label: 'Examples' },
];

function normalize(profile) {
  return {
    id: profile.id,
    expertName: profile.expertName || '',
    title: profile.title || '',
    tagline: profile.tagline || '',
    bio: profile.bio || '',
    topics: Array.isArray(profile.topics) ? profile.topics : [],
    voice: profile.voice || '',
    frameworks: profile.frameworks || '',
    rules: profile.rules || '',
    redFlags: profile.redFlags || '',
    examples: profile.examples || '',
    sources: profile.sources || '',
    draft: Boolean(profile.draft),
  };
}

export async function listProfiles() {
  return SEED_PROFILES.map(normalize);
}

/**
 * Find a profile from whatever the agent or user typed: an id, a title
 * ("Launch"), an expert name ("Dylan") or both ("Dylan's Launch profile").
 */
export async function findProfile(query) {
  const profiles = await listProfiles();
  if (!query) return profiles.length === 1 ? profiles[0] : null;

  const exact = profiles.find((p) => p.id === query);
  if (exact) return exact;

  const words = String(query).toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2);
  let best = null;
  let bestScore = 0;
  for (const profile of profiles) {
    const haystack = [profile.title, profile.expertName, profile.tagline, profile.topics.join(' ')]
      .join(' ')
      .toLowerCase();
    // The title counts double: "launch" should pick the Launch profile even if
    // another profile mentions launches in passing.
    const score = words.reduce((sum, word) => {
      if (profile.title.toLowerCase().includes(word)) return sum + 2;
      return haystack.includes(word) ? sum + 1 : sum;
    }, 0);
    if (score > bestScore) {
      best = profile;
      bestScore = score;
    }
  }
  return best;
}
