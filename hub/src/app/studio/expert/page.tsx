import type { Metadata } from "next";
import { Card, CardDescription, CardHeader, CardPanel, CardTitle } from "@/components/ui/card";
import { AvatarUpload } from "@/components/studio/avatar-upload";
import { ExpertForm } from "@/components/studio/expert-form";
import { PageHeader } from "@/components/studio/page-header";
import { requireExpert } from "@/lib/auth";

export const metadata: Metadata = { title: "Your details" };

export default async function ExpertDetailsPage() {
  const { expert } = await requireExpert();
  return (
    <div className="space-y-8">
      <PageHeader
        crumbs={[{ label: "Studio", href: "/studio" }, { label: "Your details" }]}
        title="Your details"
        description="How teams see you in the marketplace and in every answer that cites you."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">About you</CardTitle>
          </CardHeader>
          <CardPanel>
            <ExpertForm expert={expert} />
          </CardPanel>
        </Card>
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Photo</CardTitle>
            <CardDescription>Shown on your public page and marketplace cards.</CardDescription>
          </CardHeader>
          <CardPanel>
            <AvatarUpload expert={expert} />
          </CardPanel>
        </Card>
      </div>
    </div>
  );
}
