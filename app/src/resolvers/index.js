/**
 * Backend for the ExpertCTX page. The UI calls these through `invoke()`.
 * Expert profiles live on the ExpertCTX hub; this page lists them, links to
 * the hub for experts, and sets up the demo team.
 */
import Resolver from '@forge/resolver';
import { kvs } from '@forge/kvs';
import { callHub } from '../lib/hub';
import { HUB_URL } from '../lib/hub-config';
import { listProfiles } from '../lib/profiles';
import { createDemoSpace } from '../demo/create';

const resolver = new Resolver();

resolver.define('listExperts', async (req) => {
  try {
    const result = await callHub('/api/forge/v1/experts', { query: req.payload?.query || undefined });
    return { ok: true, hubUrl: HUB_URL, live: true, experts: result.experts || [] };
  } catch (error) {
    console.error('Hub unavailable for the directory', error.message);
    const bundled = await listProfiles();
    return {
      ok: true,
      hubUrl: HUB_URL,
      live: false,
      experts: bundled.map((p) => ({
        id: p.id,
        expert: p.expertName,
        expertSlug: null,
        verified: false,
        profile: p.title,
        tagline: p.tagline,
        topics: p.topics,
        frameworks: [],
        playbooks: [],
      })),
    };
  }
});

resolver.define('getDemoSpace', async () => (await kvs.get('meta:demoSpace')) || null);

resolver.define('createDemoSpace', async (req) => {
  try {
    return await createDemoSpace({ reset: Boolean(req.payload?.reset) });
  } catch (error) {
    console.error('Could not create the demo space', error);
    const hint = error.status === 403 ? ' You need permission to create spaces on this site.' : '';
    return { ok: false, message: `Could not create the demo space.${hint} (${error.message})` };
  }
});

export const handler = resolver.getDefinitions();
