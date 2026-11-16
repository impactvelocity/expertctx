import { auth } from "@clerk/nextjs/server";
import { SiteHeader } from "@/components/site/header";
import { StudioSidebar } from "@/components/studio/studio-sidebar";
import { getExpertByOwner, listProfilesForExpert } from "@/lib/data";

export default async function StudioLayout({ children }: LayoutProps<"/studio">) {
  const { userId } = await auth();
  const expert = userId ? await getExpertByOwner(userId) : null;
  const profiles = expert ? await listProfilesForExpert(expert.id) : [];

  return (
    <>
      <SiteHeader app />
      <div className="flex flex-1">
        {expert ? <StudioSidebar expert={expert} profiles={profiles} /> : null}
        <main className="min-w-0 flex-1 bg-background">
          <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8">{children}</div>
        </main>
      </div>
    </>
  );
}
