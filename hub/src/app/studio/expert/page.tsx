import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardPanel, CardTitle } from "@/components/ui/card";
import { AvatarUpload } from "@/components/studio/avatar-upload";
import { ExpertForm } from "@/components/studio/expert-form";
import { requireExpert } from "@/lib/auth";

export const metadata: Metadata = { title: "Your details" };

export default async function ExpertDetailsPage() {
  const { expert } = await requireExpert();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button variant="ghost" size="sm" render={<Link href="/studio" />}>
        <ChevronLeft aria-hidden />
        Studio
      </Button>
      <h1 className="font-display text-4xl">Your details</h1>
      <Card>
        <CardHeader>
          <CardTitle>Photo</CardTitle>
          <CardDescription>Shown on your public page and marketplace cards.</CardDescription>
        </CardHeader>
        <CardPanel>
          <AvatarUpload expert={expert} />
        </CardPanel>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>About you</CardTitle>
        </CardHeader>
        <CardPanel>
          <ExpertForm expert={expert} />
        </CardPanel>
      </Card>
    </div>
  );
}
