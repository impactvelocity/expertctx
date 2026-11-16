import { after } from "next/server";
import { recordUsage } from "@/lib/data";
import { forgeRoute } from "@/lib/forge-auth";
import { knowledgeForQuery } from "@/lib/knowledge";

/**
 * One expert profile's knowledge for one question. Only the question and the
 * expert name arrive here; the team's own pages stay in Atlassian.
 */
export const POST = forgeRoute(async (request, caller) => {
  const body = (await request.json().catch(() => ({}))) as { expert?: string; question?: string };
  const { profileId, payload } = await knowledgeForQuery(body.expert, String(body.question ?? "").slice(0, 2000));
  if (profileId) after(() => recordUsage(profileId, caller.cloudId === "dev" ? null : caller.cloudId));
  return payload;
});
