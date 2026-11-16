import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Lozenge } from "@/components/brand/lozenge";
import { PageHeader } from "@/components/studio/page-header";
import { ProfileEditor } from "@/components/studio/profile-editor";
import { PublishControls } from "@/components/studio/publish-controls";
import { requireOwnProfile } from "@/lib/auth";
import { listSources } from "@/lib/data";

export const metadata: Metadata = { title: "Edit profile" };

// Reading a long page or transcribing a recording runs after the response is sent; give it room.
export const maxDuration = 300;

export default async function EditProfilePage({ params, searchParams }: PageProps<"/studio/profiles/[id]">) {
  const { id } = await params;
  const tab = (await searchParams).tab;
  const owned = await requireOwnProfile(id).catch(() => null);
  if (!owned) notFound();
  const { expert, profile } = owned;
  const sources = await listSources(profile.id);
  const published = profile.status === "published";

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: "Studio", href: "/studio" }, { label: "Profiles", href: "/studio" }, { label: profile.title }]}
        title={profile.title}
        meta={published ? <Lozenge appearance="success">Published</Lozenge> : <Lozenge>Draft</Lozenge>}
        description={
          <>
            {profile.tagline || "No tagline yet."}
            <span className="mt-1 block text-xs">
              Profile id <code className="rounded-[3px] bg-muted px-1 py-0.5 font-mono">{profile.id}</code>
            </span>
          </>
        }
        actions={
          <>
            {published ? (
              <Button variant="outline" render={<Link href={`/experts/${expert.slug}#${profile.id}`} />}>
                <Eye aria-hidden />
                View public
              </Button>
            ) : null}
            <PublishControls profileId={profile.id} published={published} />
          </>
        }
      />
      <ProfileEditor profile={profile} sources={sources} initialTab={typeof tab === "string" ? tab : "brain"} />
    </div>
  );
}
