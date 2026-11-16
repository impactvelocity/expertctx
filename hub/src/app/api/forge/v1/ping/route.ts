import { recordInstall } from "@/lib/data";
import { forgeRoute } from "@/lib/forge-auth";

export const POST = forgeRoute(async (_request, caller) => {
  if (caller.cloudId && caller.cloudId !== "dev") await recordInstall(caller.cloudId);
  return { ok: true, hub: "ExpertCTX", cloudId: caller.cloudId, environment: caller.environment };
});
export const GET = POST;
