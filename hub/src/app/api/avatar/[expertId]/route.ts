import { fileUrl } from "@/lib/blob";
import { getExpert } from "@/lib/data";

export async function GET(_request: Request, ctx: RouteContext<"/api/avatar/[expertId]">) {
  const { expertId } = await ctx.params;
  const expert = await getExpert(expertId);
  if (!expert?.avatarPath) return new Response("Not found", { status: 404 });
  const url = await fileUrl(expert.avatarPath);
  return Response.redirect(url, 302);
}
