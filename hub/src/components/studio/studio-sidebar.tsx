import { ExternalLink, Home, LayoutGrid, PlugZap, UserRound } from "lucide-react";
import { ExpertAvatar } from "@/components/site/expert-avatar";
import type { Expert, Profile } from "@/lib/types";
import { NewProfileDialog } from "./new-profile-dialog";
import { SidebarLink } from "./sidebar-link";

export function StudioSidebar({ expert, profiles }: { expert: Expert; profiles: Profile[] }) {
  return (
    <aside className="hidden w-64 shrink-0 border-r bg-sidebar lg:block">
      <div className="sticky top-14 flex h-[calc(100dvh-3.5rem)] flex-col gap-6 overflow-y-auto p-3">
        <div className="flex items-center gap-2.5 rounded-lg px-2 pt-2">
          <ExpertAvatar expert={expert} className="size-8 rounded-md text-xs" />
          <div className="min-w-0">
            <p className="truncate font-semibold text-sm">{expert.name}</p>
            <p className="text-muted-foreground text-xs">Expert studio</p>
          </div>
        </div>

        <nav className="space-y-0.5">
          <SidebarLink href="/studio" exact icon={<Home aria-hidden />}>
            Overview
          </SidebarLink>
          <SidebarLink href="/studio/expert" icon={<UserRound aria-hidden />}>
            Your details
          </SidebarLink>
        </nav>

        <div className="space-y-1">
          <div className="flex items-center justify-between px-2">
            <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">Profiles</p>
            <NewProfileDialog compact />
          </div>
          <nav className="space-y-0.5">
            {profiles.map((profile) => (
              <SidebarLink
                key={profile.id}
                href={`/studio/profiles/${profile.id}`}
                icon={
                  <span
                    aria-hidden
                    className={
                      profile.status === "published"
                        ? "size-2 rounded-full bg-success"
                        : "size-2 rounded-full border border-muted-foreground/50"
                    }
                  />
                }
              >
                {profile.title}
              </SidebarLink>
            ))}
            {!profiles.length ? <p className="px-2 py-1 text-muted-foreground text-xs">No profiles yet</p> : null}
          </nav>
        </div>

        <div className="mt-auto space-y-0.5 border-t pt-3">
          <SidebarLink href={`/experts/${expert.slug}`} external icon={<ExternalLink aria-hidden />}>
            Public page
          </SidebarLink>
          <SidebarLink href="/experts" external icon={<LayoutGrid aria-hidden />}>
            Marketplace
          </SidebarLink>
          <SidebarLink href="/install" external icon={<PlugZap aria-hidden />}>
            Install for Confluence
          </SidebarLink>
        </div>
      </div>
    </aside>
  );
}
