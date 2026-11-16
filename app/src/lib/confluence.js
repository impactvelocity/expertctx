/**
 * Confluence REST calls used by the agent's actions.
 *
 * Every call runs as the user talking to the agent (`asUser()`), so the agent
 * can only see and create pages that person is allowed to see and create.
 * We use the stable v1 content and search APIs.
 */
import api, { route } from '@forge/api';
import { storageToText } from './storage-format';

async function confluence(path, options = {}) {
  const response = await api.asUser().requestConfluence(path, {
    ...options,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  if (!response.ok) {
    const body = await response.text();
    const error = new Error(`Confluence API ${response.status}: ${body.slice(0, 300)}`);
    error.status = response.status;
    throw error;
  }
  return response.status === 204 ? null : response.json();
}

/** Escape a value for use inside a double-quoted CQL string. */
function cqlString(value) {
  return `"${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

/** Shape a Confluence content result into what the agent needs. */
function toPage(content, baseUrl, maxChars) {
  const storage = content.body?.storage?.value || '';
  const text = storageToText(storage);
  // People @mentioned on the page (team members, owners). Names are filled in later.
  const mentions = [...new Set([...storage.matchAll(/ri:account-id="([^"]+)"/g)].map((m) => m[1]))];
  const createdBy = content.history?.createdBy;
  const lastBy = content.version?.by;
  return {
    id: content.id,
    title: content.title,
    spaceKey: content.space?.key,
    url: content._links?.webui ? `${baseUrl}${content._links.webui}` : undefined,
    createdBy: createdBy ? { accountId: createdBy.accountId, name: createdBy.displayName } : undefined,
    lastUpdatedBy: lastBy ? { accountId: lastBy.accountId, name: lastBy.displayName } : undefined,
    lastUpdated: content.version?.when,
    mentions,
    // An "Owner: @person" line names who owns the page, whoever typed it in.
    ownerId: text.match(/Owner:\s*@\[([A-Za-z0-9:_-]+)\]/)?.[1],
    text: text.length > maxChars ? `${text.slice(0, maxChars)} …[truncated]` : text,
  };
}

/** Display names for account ids, as a Map. Unknown ids are left out. */
export async function getUserNames(accountIds) {
  const names = new Map();
  const ids = [...new Set(accountIds)].filter(Boolean);
  for (let i = 0; i < ids.length; i += 50) {
    const params = new URLSearchParams();
    ids.slice(i, i + 50).forEach((id) => params.append('accountId', id));
    const result = await confluence(route`/wiki/rest/api/user/bulk?${params}`);
    for (const user of result.results || []) names.set(user.accountId, user.displayName);
  }
  return names;
}

const EXPAND = 'space,history,version,body.storage';

/**
 * One page by id. The v1 "get content by id" endpoint has been removed (410),
 * but v1 CQL search still returns authors with display names, which the v2
 * pages API doesn't, so we look the page up by id through search.
 */
export async function getPage(pageId, maxChars = 8000) {
  const [page] = await searchPages(`id = ${String(Number(pageId))}`, { limit: 1, maxChars });
  if (!page) {
    const error = new Error(`Page ${pageId} not found`);
    error.status = 404;
    throw error;
  }
  return page;
}

/** Pages matching a CQL query, newest first. */
export async function searchPages(cql, { limit = 15, maxChars = 700 } = {}) {
  const result = await confluence(
    route`/wiki/rest/api/content/search?cql=${cql}&limit=${String(limit)}&expand=${EXPAND}`
  );
  const baseUrl = result._links?.base || '';
  return (result.results || []).map((content) => toPage(content, baseUrl, maxChars));
}

/** A page in a space with exactly this title, or null. */
export async function findPageByTitle(spaceKey, title) {
  const [page] = await searchPages(`space = ${cqlString(spaceKey)} AND type = page AND title = ${cqlString(title)}`, {
    limit: 1,
    maxChars: 100,
  });
  return page || null;
}

export async function pagesInSpace(spaceKey, options) {
  return searchPages(`space = ${cqlString(spaceKey)} AND type = page ORDER BY lastmodified DESC`, options);
}

export async function findPagesByText(text, spaceKey, options) {
  const space = spaceKey ? ` AND space = ${cqlString(spaceKey)}` : '';
  return searchPages(
    `type = page AND (title ~ ${cqlString(text)} OR text ~ ${cqlString(text)})${space} ORDER BY lastmodified DESC`,
    options
  );
}

/**
 * Create a page from storage-format XHTML. If the title is taken, add the date
 * (and then a time) rather than failing, since the agent often reuses titles.
 */
/** A space by key (v2), or null if it doesn't exist or the user can't see it. */
export async function findSpace(spaceKey) {
  const result = await confluence(route`/wiki/api/v2/spaces?keys=${spaceKey}`);
  return result.results?.[0] || null;
}

/** Create a space (v1, the current create endpoint). Returns its key, homepage id and URL. */
export async function createSpace({ key, name, description }) {
  const space = await confluence(route`/wiki/rest/api/space`, {
    method: 'POST',
    body: JSON.stringify({
      key,
      name,
      description: { plain: { value: description, representation: 'plain' } },
    }),
  });
  return {
    key: space.key,
    homepageId: space.homepage?.id,
    url: `${space._links?.base || ''}${space._links?.webui || ''}`,
  };
}

/**
 * The accountId of a user with exactly this display name, or null.
 * The general CQL search works with the user's token; the dedicated
 * /search/user endpoint returned "Authentication Required" (as user) and
 * "scope does not match" (as app) on the demo site, so it's only a fallback.
 */
export async function findUserByName(displayName) {
  const name = String(displayName).replace(/"/g, '');
  const attempts = [
    ['general search as user', () => confluence(route`/wiki/rest/api/search?cql=${`type = user AND user.fullname ~ "${name}"`}&limit=5`)],
    ['user search as user', () => confluence(route`/wiki/rest/api/search/user?cql=${`user.fullname ~ "${name}"`}&limit=5`)],
  ];
  for (const [label, attempt] of attempts) {
    try {
      const result = await attempt();
      const match = (result.results || [])
        .map((r) => r.user)
        .find((u) => u?.displayName?.toLowerCase() === name.toLowerCase());
      if (match?.accountId) {
        console.log(`Found ${name} via ${label}`);
        return match.accountId;
      }
    } catch (error) {
      console.log(`User lookup via ${label} failed: ${error.message.slice(0, 120)}`);
    }
  }
  return null;
}

/** Replace a page's body (v2). Needs the next version number. */
export async function updatePageBody(pageId, title, storage) {
  const page = await confluence(route`/wiki/api/v2/pages/${pageId}`);
  await confluence(route`/wiki/api/v2/pages/${pageId}`, {
    method: 'PUT',
    body: JSON.stringify({
      id: String(pageId),
      status: 'current',
      title: title || page.title,
      body: { representation: 'storage', value: storage },
      version: { number: (page.version?.number || 1) + 1, message: 'ExpertCTX demo content' },
    }),
  });
}

/** v2 APIs address spaces by numeric id, not key. */
async function spaceIdForKey(spaceKey) {
  const result = await confluence(route`/wiki/api/v2/spaces?keys=${spaceKey}`);
  const space = result.results?.[0];
  if (!space) {
    const error = new Error(`Space ${spaceKey} not found`);
    error.status = 404;
    throw error;
  }
  return space.id;
}

export async function createPage({ spaceKey, title, storage, parentId }) {
  const spaceId = await spaceIdForKey(spaceKey);
  const stamp = new Date().toISOString();
  const titles = [title, `${title} (${stamp.slice(0, 10)})`, `${title} (${stamp.slice(0, 16).replace('T', ' ')})`];
  let lastError;
  for (const candidate of titles) {
    try {
      const page = await confluence(route`/wiki/api/v2/pages`, {
        method: 'POST',
        body: JSON.stringify({
          spaceId,
          status: 'current',
          title: candidate,
          ...(parentId ? { parentId: String(parentId) } : {}),
          body: { representation: 'storage', value: storage },
        }),
      });
      const base = page._links?.base || '';
      return {
        id: page.id,
        title: page.title,
        url: `${base}${base ? '' : '/wiki'}${page._links?.webui || ''}`,
      };
    } catch (error) {
      lastError = error;
      // 400 with "already exists" means a title clash; anything else is real.
      if (!(error.status === 400 && /already exists/i.test(error.message))) throw error;
    }
  }
  throw lastError;
}
