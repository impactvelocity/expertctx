/**
 * Rovo actions: the tools the ExpertCTX agent calls.
 *
 * Each handler receives `payload` (the inputs Rovo extracted from the chat,
 * plus `context` about where the user is) and returns a string or JSON that
 * the agent turns into its answer.
 *
 * Inputs are filled in by the language model, so they can be wrong or made
 * up. We never use them for permission checks: every Confluence call runs as
 * the signed-in user.
 */
import { listProfiles, findProfile, SECTIONS } from '../lib/profiles';
import { callHub } from '../lib/hub';
import { getPage, pagesInSpace, findPagesByText, createPage, getUserNames } from '../lib/confluence';
import { markdownToStorage } from '../lib/storage-format';

/** Where the user is in Confluence, if Rovo told us. */
function confluenceContext(payload) {
  const context = payload?.context || {};
  const c = context.confluence || context;
  return {
    pageId: c.contentId || c.pageId || c.content?.id,
    spaceKey: c.spaceKey || c.space?.key,
  };
}

/** Rovo sometimes sends empty strings or the literal "null" for optional inputs. */
function clean(value) {
  if (value === undefined || value === null) return undefined;
  const text = String(value).trim();
  return text && text.toLowerCase() !== 'null' && text.toLowerCase() !== 'undefined' ? text : undefined;
}

function errorResult(message, error) {
  if (error) console.error(message, error);
  return { ok: false, message: error ? `${message} (${error.message})` : message };
}

// ---------------------------------------------------------------------------
// list-experts
// ---------------------------------------------------------------------------
export async function listExperts(payload) {
  const topic = clean(payload?.topic);
  try {
    return await callHub('/api/forge/v1/experts', { topic });
  } catch (error) {
    console.error('Hub unavailable for list-experts, using bundled profiles', error.message);
  }
  try {
    const profiles = await listProfiles();
    const t = topic?.toLowerCase();
    const experts = profiles
      .filter((p) => !t || [p.title, p.tagline, ...p.topics].join(' ').toLowerCase().includes(t))
      .map((p) => ({
        id: p.id,
        expert: p.expertName,
        profile: p.title,
        tagline: p.tagline,
        topics: p.topics,
        draft: p.draft,
      }));
    return {
      ok: true,
      experts,
      note: 'The ExpertCTX hub could not be reached, so these are the profiles bundled with the app.',
    };
  } catch (error) {
    return errorResult('Could not load expert profiles', error);
  }
}

// ---------------------------------------------------------------------------
// get-expert-knowledge
// ---------------------------------------------------------------------------

/** Split a Markdown section into chunks at headings and top-level bullets. */
function chunks(markdown) {
  const parts = [];
  let current = [];
  for (const line of String(markdown || '').split('\n')) {
    const startsChunk = /^#{1,4}\s/.test(line) || /^[-*]\s/.test(line);
    if (startsChunk && current.length) {
      parts.push(current.join('\n').trim());
      current = [];
    }
    current.push(line);
  }
  if (current.length) parts.push(current.join('\n').trim());
  return parts.filter(Boolean);
}

/** How many of the question's words appear in a chunk. Crude, but predictable. */
function relevance(chunk, words) {
  const text = chunk.toLowerCase();
  return words.reduce((score, word) => (text.includes(word) ? score + 1 : score), 0);
}

// Below this size we hand the agent the whole profile; above it, only the
// chunks that look relevant to the question.
const FULL_PROFILE_LIMIT = 15000;

export async function getExpertKnowledge(payload) {
  const expert = clean(payload?.expert);
  const question = clean(payload?.question);
  try {
    // Live profiles, playbooks and source excerpts from the hub.
    return await callHub('/api/forge/v1/knowledge', { expert, question });
  } catch (error) {
    console.error('Hub unavailable for get-expert-knowledge, using bundled profiles', error.message);
  }
  return bundledKnowledge(expert, question);
}

/** The same answer from the profiles bundled with the app, if the hub is down. */
async function bundledKnowledge(expertQuery, question) {
  try {
    const profile = await findProfile(expertQuery);
    if (!profile) {
      const profiles = await listProfiles();
      return {
        ok: false,
        message: 'No expert profile matches. Ask the user which expert they mean.',
        available: profiles.map((p) => `${p.expertName}: ${p.title} (id: ${p.id})`),
      };
    }

    const header = {
      id: profile.id,
      expert: profile.expertName,
      profile: profile.title,
      tagline: profile.tagline,
      bio: profile.bio,
      voice: profile.voice,
      sources: profile.sources,
      draft: profile.draft,
    };

    const total = SECTIONS.reduce((n, s) => n + profile[s.key].length, 0);
    if (total <= FULL_PROFILE_LIMIT) {
      const knowledge = Object.fromEntries(SECTIONS.map((s) => [s.label, profile[s.key]]));
      return { ok: true, ...header, knowledge, note: 'From the profile bundled with the app (the hub was unreachable).' };
    }

    // Large profile: rules are always included (they're the expert's
    // non-negotiables); other sections are trimmed to the best matches.
    const words = String(question || '')
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 3);
    const knowledge = { Rules: profile.rules };
    for (const section of SECTIONS.filter((s) => s.key !== 'rules')) {
      const ranked = chunks(profile[section.key])
        .map((chunk) => ({ chunk, score: relevance(chunk, words) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 6)
        .map((r) => r.chunk);
      knowledge[section.label] = ranked.join('\n\n');
    }
    return { ok: true, ...header, knowledge, note: 'Profile trimmed to the parts most relevant to the question.' };
  } catch (error) {
    return errorResult('Could not load the expert profile', error);
  }
}

// ---------------------------------------------------------------------------
// get-team-context
// ---------------------------------------------------------------------------

/**
 * Who wrote, edited or is named on which pages: the "who knows what" signal
 * the agent uses to suggest owners. Also swaps @[accountId] in page text for
 * @Name so the agent can read who a page mentions.
 */
async function peopleFrom(pages, currentAccountId) {
  const people = new Map();
  const add = (person, title, role) => {
    if (!person?.accountId) return;
    const entry = people.get(person.accountId) || {
      accountId: person.accountId,
      name: person.name,
      owns: [],
      wrote: [],
      edited: [],
      mentionedOn: [],
    };
    if (!entry.name && person.name) entry.name = person.name;
    if (!entry[role].includes(title)) entry[role].push(title);
    people.set(person.accountId, entry);
  };
  for (const page of pages) {
    if (page.ownerId) add({ accountId: page.ownerId }, page.title, 'owns');
    add(page.createdBy, page.title, 'wrote');
    if (page.lastUpdatedBy?.accountId !== page.createdBy?.accountId) add(page.lastUpdatedBy, page.title, 'edited');
    for (const accountId of page.mentions || []) add({ accountId }, page.title, 'mentionedOn');
  }

  // Look up names for people we only know from @mentions.
  const unnamed = [...people.values()].filter((p) => !p.name).map((p) => p.accountId);
  if (unnamed.length) {
    try {
      const names = await getUserNames(unnamed);
      for (const [accountId, name] of names) people.get(accountId).name = name;
    } catch (error) {
      console.error('Could not look up user names', error);
    }
  }
  for (const page of pages) {
    page.text = page.text.replace(/@\[([A-Za-z0-9:_-]+)\]/g, (match, id) =>
      people.get(id)?.name ? `@${people.get(id).name}` : match
    );
    delete page.mentions;
    delete page.ownerId;
  }

  // Strongest signal first: page owners, then authors, editors, mentions.
  const weight = (p) => p.owns.length * 4 + p.wrote.length * 2 + p.edited.length + p.mentionedOn.length;
  return [...people.values()]
    .filter((p) => p.name)
    .sort((a, b) => weight(b) - weight(a))
    .map((p) => ({
      ...p,
      ...(p.accountId === currentAccountId ? { isYou: true } : {}),
      mention: `@[${p.accountId}]`,
    }));
}

export async function getTeamContext(payload) {
  try {
    const here = confluenceContext(payload);
    const pageId = clean(payload?.pageId) || here.pageId;
    const goal = clean(payload?.goal);
    // Logs only ids and keys, never page content.
    console.log('get-team-context', JSON.stringify({ contextKeys: Object.keys(payload?.context || {}), here, pageId, goal: Boolean(goal) }));
    let spaceKey = clean(payload?.spaceKey) || here.spaceKey;

    // 1. The anchor page: the page the user is on or named, or the best match for the goal.
    let anchor = null;
    if (pageId && /^\d+$/.test(pageId)) {
      anchor = await getPage(pageId);
    } else if (goal) {
      const [match] = await findPagesByText(goal, spaceKey, { limit: 1, maxChars: 8000 });
      anchor = match || null;
    }
    spaceKey = spaceKey || anchor?.spaceKey;

    if (!anchor && !spaceKey) {
      return {
        ok: false,
        message:
          'No page or space to read. Ask the user to open the page with their plan or goal, ' +
          'or to name the page or space.',
      };
    }

    // 2. The rest of the team's recent pages in that space.
    const related = spaceKey ? await pagesInSpace(spaceKey, { limit: 15, maxChars: 700 }) : [];
    const others = related.filter((page) => page.id !== anchor?.id);

    // 3. People, from who wrote and edited those pages.
    const people = await peopleFrom([anchor, ...others].filter(Boolean), payload?.context?.accountId);

    return {
      ok: true,
      spaceKey,
      anchorPage: anchor,
      relatedPages: others,
      people,
      howToAssign: 'To assign a task to someone in a plan page, write their "mention" value, e.g. "- [ ] Task @[accountId]". Only use accountIds from this list.',
    };
  } catch (error) {
    if (error.status === 404) return errorResult('That page or space was not found, or the user cannot see it.');
    return errorResult('Could not read the team context', error);
  }
}

// ---------------------------------------------------------------------------
// create-plan-page
// ---------------------------------------------------------------------------
export async function createPlanPage(payload) {
  try {
    const here = confluenceContext(payload);
    const title = clean(payload?.title);
    let content = clean(payload?.content);
    // Confluence already shows the title, so drop a leading heading that repeats it.
    if (title && content) {
      const [first, ...rest] = content.split('\n');
      const heading = first.replace(/^#+\s*/, '').trim().toLowerCase();
      if (/^#/.test(first) && heading === title.trim().toLowerCase()) content = rest.join('\n').trim();
    }
    const spaceKey = clean(payload?.spaceKey) || here.spaceKey;
    // By default, file the new page under the page the user is looking at.
    const parentId = clean(payload?.parentPageId) || here.pageId;

    if (!title || !content) return errorResult('A plan page needs a title and content.');
    if (!spaceKey) return errorResult('No space to create the page in. Ask the user which space to use.');

    const footer =
      '\n\n---\n> Created by ExpertCTX from the team\'s pages and the expert\'s documented knowledge. ' +
      'Review before acting on it.';
    const page = await createPage({
      spaceKey,
      title,
      parentId: parentId && /^\d+$/.test(parentId) ? parentId : undefined,
      storage: markdownToStorage(content + footer),
    });
    return { ok: true, message: `Created the page "${page.title}".`, page };
  } catch (error) {
    if (error.status === 403) return errorResult('The user is not allowed to create pages in that space.');
    return errorResult('Could not create the plan page', error);
  }
}
