"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { claimExpertAction } from "@/app/studio/actions";
import { toastResult } from "./use-toast-result";

export function ClaimButton({ expertId }: { expertId: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <Button
      size="sm"
      loading={pending}
      onClick={() =>
        start(async () => {
          const result = await claimExpertAction(expertId);
          toastResult(result);
          if (result.ok) router.refresh();
        })
      }
    >
      Claim
    </Button>
  );
}
