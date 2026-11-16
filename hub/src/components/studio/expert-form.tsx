"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createExpertAction, updateExpertAction } from "@/app/studio/actions";
import type { Expert } from "@/lib/types";
import { FieldRow } from "./field-row";
import { useToastResult } from "./use-toast-result";

export function ExpertForm({ expert, defaultName }: { expert?: Expert; defaultName?: string }) {
  const [result, action, pending] = useActionState(expert ? updateExpertAction : createExpertAction, null);
  useToastResult(result);
  return (
    <form action={action} className="space-y-5">
      <FieldRow label="Name" description="As teams will see it in answers: “Dylan Jones’s Launch framework”.">
        <Input name="name" defaultValue={expert?.name ?? defaultName ?? ""} required maxLength={80} />
      </FieldRow>
      <FieldRow label="Headline" description="One line on what you're known for.">
        <Input
          name="headline"
          defaultValue={expert?.headline ?? ""}
          placeholder="20 years launching SaaS products and offers"
          required
          maxLength={140}
        />
      </FieldRow>
      <FieldRow label="Bio" description="Who you are and why teams should trust your judgment.">
        <Textarea name="bio" defaultValue={expert?.bio ?? ""} rows={5} maxLength={2000} />
      </FieldRow>
      <FieldRow label="Links" description="One per line, e.g. “Website https://example.com”.">
        <Textarea
          name="links"
          defaultValue={expert?.links.map((l) => `${l.label} ${l.url}`).join("\n") ?? ""}
          rows={3}
          placeholder="Website https://example.com"
        />
      </FieldRow>
      <Button type="submit" loading={pending}>
        {expert ? "Save details" : "Create expert profile"}
      </Button>
    </form>
  );
}
