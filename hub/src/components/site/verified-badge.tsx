import { BadgeCheck } from "lucide-react";
import { Lozenge } from "@/components/brand/lozenge";

export function VerifiedBadge({ verified, kind }: { verified: boolean; kind?: "expert" | "method-pack" }) {
  if (kind === "method-pack") return <Lozenge appearance="new">Method pack</Lozenge>;
  return verified ? (
    <Lozenge appearance="inprogress">
      <BadgeCheck aria-hidden />
      Verified
    </Lozenge>
  ) : (
    <Lozenge>Unverified</Lozenge>
  );
}
