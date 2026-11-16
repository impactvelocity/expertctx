import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProfileEditor } from "@/components/studio/profile-editor";
import { PublishControls } from "@/components/studio/publish-controls";
import { requireOwnProfile } from "@/lib/auth";
import { listSources } from "@/lib/data";

export const metadata: Metadata = { title: "Edit profile" };

export default async function EditProfilePage({ params, searchParams }: PageProps<"/studio/profiles/[id]">) {
  const { id } = await params;
  const tab = (await searchParams).tab;
  const owned = await requireOwnProfile(id).catch(() => null);
  if (!owned) notFound();
  const { expert, profile } = owned;
  const sources = await listSources(profile.id);

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" render={<Link href="/studio" />}>
        <ChevronLeft aria-hidden />
        Studio
      </Button>
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-4xl">{profile.title}</h1>
            {profile.status === "published" ? <Badge variant="success">Published</Badge> : <Badge variant="outline">Draft</Badge>}
          </div>
          <p className="text-muted-foreground">
            {expert.name} · id <code className="rounded bg-muted px-1 text-xs">{profile.id}</code>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {profile.status === "published" ? (
            <Button variant="outline" render={<Link href={`/experts/${expert.slug}#${profile.id}`} />}>
              <Eye aria-hidden />
              View public
            </Button>
          ) : null}
          <PublishControls profileId={profile.id} published={profile.status === "published"} />
        </div>
      </div>
      <ProfileEditor profile={profile} sources={sources} initialTab={typeof tab === "string" ? tab : "overview"} />
    </div>
  );
}
