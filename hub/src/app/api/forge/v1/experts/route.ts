import { forgeRoute } from "@/lib/forge-auth";
import { profileSummary, searchProfiles } from "@/lib/knowledge";

/** Published expert profiles, optionally filtered by a topic or a search. */
export const POST = forgeRoute(async (request) => {
  const body = (await request.json().catch(() => ({}))) as { topic?: string; query?: string };
  const query = [body.topic, body.query].filter(Boolean).join(" ");
  const profiles = await searchProfiles(query);
  return {
    ok: true,
    experts: profiles.map(profileSummary),
    ...(profiles.length ? {} : { note: "No published expert profile matches that topic." }),
  };
});
