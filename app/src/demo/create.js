/**
 * Builds the Pebblepath demo space on the current site, as the signed-in user.
 *
 * - No space yet: create it, write the home page and the team's pages.
 * - Space exists and `reset` is false: change nothing, return the link.
 * - Space exists and `reset` is true: rewrite each demo page to its original
 *   text (creating any that are missing). Other pages in the space, such as
 *   plan pages the agent created, are left alone.
 */
import { kvs } from '@forge/kvs';
import {
  findSpace,
  createSpace,
  createPage,
  findPageByTitle,
  findUserByName,
  updatePageBody,
} from '../lib/confluence';
import { markdownToStorage } from '../lib/storage-format';
import { DEMO_SPACE, DEMO_PEOPLE, DEMO_HOME, DEMO_PAGES } from './content';

/** Swap {{alana}}-style placeholders for @mentions (or plain names if the user isn't on this site). */
function fillPeople(markdown, accountIds) {
  return markdown.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const person = DEMO_PEOPLE[key];
    if (!person) return match;
    return accountIds[key] ? `@[${accountIds[key]}]` : person.name;
  });
}

async function findPeople() {
  const accountIds = {};
  for (const [key, person] of Object.entries(DEMO_PEOPLE)) {
    accountIds[key] = await findUserByName(person.name);
  }
  return accountIds;
}

/** Site URL for a space, built from the base URL of any page we created. */
function spaceUrlFrom(pageUrl, key) {
  const base = String(pageUrl || '').split('/wiki/')[0];
  return base ? `${base}/wiki/spaces/${key}/overview` : undefined;
}

export async function createDemoSpace({ reset = false } = {}) {
  const existing = await findSpace(DEMO_SPACE.key);
  const stored = await kvs.get('meta:demoSpace');

  if (existing && !reset) {
    return {
      ok: true,
      created: false,
      message: `The ${DEMO_SPACE.name} space already exists, so nothing was changed.`,
      url: stored?.url,
      key: DEMO_SPACE.key,
    };
  }

  const accountIds = await findPeople();
  const space = existing
    ? { key: existing.key, homepageId: existing.homepageId, url: stored?.url }
    : await createSpace(DEMO_SPACE);

  if (space.homepageId) {
    await updatePageBody(space.homepageId, `${DEMO_SPACE.name} home`, markdownToStorage(fillPeople(DEMO_HOME, accountIds)));
  }

  const pages = [];
  for (const page of DEMO_PAGES) {
    const storage = markdownToStorage(fillPeople(page.body, accountIds));
    const current = existing ? await findPageByTitle(space.key, page.title) : null;
    if (current) {
      await updatePageBody(current.id, page.title, storage);
      pages.push(current);
    } else {
      pages.push(await createPage({ spaceKey: space.key, title: page.title, parentId: space.homepageId, storage }));
    }
  }

  const url = space.url || spaceUrlFrom(pages[0]?.url, space.key);
  await kvs.set('meta:demoSpace', { key: space.key, url, updatedAt: new Date().toISOString() });

  const found = Object.values(accountIds).filter(Boolean).length;
  return {
    ok: true,
    created: !existing,
    message:
      `${existing ? 'Reset' : 'Created'} the ${DEMO_SPACE.name} space with ${pages.length} pages. ` +
      `${found} of ${Object.keys(DEMO_PEOPLE).length} team members were found on this site and @mentioned.`,
    url,
    key: space.key,
  };
}
