/**
 * Calls to the ExpertCTX hub, where experts publish their profiles.
 *
 * invokeRemote sends a Forge Invocation Token signed by Atlassian with every
 * call, so the hub knows the call came from this app on a real site. We send
 * only the question and the expert's name, never the team's pages.
 */
import { invokeRemote } from '@forge/api';
import { HUB_REMOTE_KEY } from './hub-config';

const TIMEOUT_MS = 9000;

export class HubError extends Error {}

export async function callHub(path, body = {}) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new HubError('The ExpertCTX hub took too long to answer')), TIMEOUT_MS);
  });
  try {
    const response = await Promise.race([
      invokeRemote(HUB_REMOTE_KEY, {
        path,
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      }),
      timeout,
    ]);
    if (!response.ok) throw new HubError(`The ExpertCTX hub answered ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}
