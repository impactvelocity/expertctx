import "server-only";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";

/**
 * Every call from the Forge app carries a Forge Invocation Token (FIT): a JWT
 * signed by Atlassian. Checking it proves the call came from our app on a real
 * Atlassian site, and tells us which site (cloudId). No API keys for judges.
 */
const JWKS = createRemoteJWKSet(new URL("https://forge.cdn.prod.atlassian-dev.net/.well-known/jwks.json"));

const APP_ID = process.env.FORGE_APP_ID ?? "";
// The token's audience is the app id; accept both the ARI and the bare UUID.
const AUDIENCES = [APP_ID, APP_ID.replace(/^ari:cloud:ecosystem::app\//, "")].filter(Boolean);

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(120, "1 m"),
  prefix: "ratelimit:forge",
});

type FitClaims = JWTPayload & {
  app?: { id?: string; installationId?: string; installation?: { id?: string }; environment?: { type?: string } };
  context?: { cloudId?: string; siteUrl?: string };
};

export type ForgeCaller = { cloudId: string | null; installationId: string | null; environment: string | null };

export class ForgeAuthError extends Error {
  constructor(
    message: string,
    public status = 401,
  ) {
    super(message);
  }
}

export async function verifyForgeRequest(request: Request): Promise<ForgeCaller> {
  // Local testing only: a shared key, never set in production.
  const devKey = process.env.HUB_DEV_KEY;
  if (devKey && request.headers.get("x-hub-dev-key") === devKey) {
    return { cloudId: "dev", installationId: "dev", environment: "dev" };
  }

  const header = request.headers.get("authorization") ?? "";
  const token = header.replace(/^Bearer\s+/i, "");
  if (!token) throw new ForgeAuthError("Missing Forge Invocation Token");
  if (!AUDIENCES.length) throw new ForgeAuthError("FORGE_APP_ID is not configured", 500);

  let claims: FitClaims;
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: "forge/invocation-token",
      audience: AUDIENCES,
      clockTolerance: 5,
    });
    claims = payload as FitClaims;
  } catch (error) {
    console.error("FIT verification failed", error instanceof Error ? error.message : error);
    throw new ForgeAuthError("Invalid Forge Invocation Token");
  }

  const caller: ForgeCaller = {
    cloudId: claims.context?.cloudId ?? null,
    installationId: claims.app?.installationId ?? claims.app?.installation?.id ?? null,
    environment: claims.app?.environment?.type ?? null,
  };

  const { success } = await ratelimit.limit(caller.cloudId ?? caller.installationId ?? "unknown");
  if (!success) throw new ForgeAuthError("Too many requests from this site", 429);
  return caller;
}

/** Run a Forge API handler with token checks and JSON errors. */
export function forgeRoute(handler: (request: Request, caller: ForgeCaller) => Promise<unknown>) {
  return async (request: Request) => {
    try {
      const caller = await verifyForgeRequest(request);
      return Response.json(await handler(request, caller));
    } catch (error) {
      if (error instanceof ForgeAuthError) {
        return Response.json({ ok: false, message: error.message }, { status: error.status });
      }
      console.error("forge route failed", error);
      // A 200 with ok:false lets the agent explain the problem instead of failing the action.
      return Response.json({ ok: false, message: "The ExpertCTX hub hit an error. Try again in a moment." });
    }
  };
}
