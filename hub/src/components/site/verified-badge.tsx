import { BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function VerifiedBadge({ verified, kind }: { verified: boolean; kind?: "expert" | "method-pack" }) {
  if (kind === "method-pack") return <Badge variant="secondary">Method pack</Badge>;
  return verified ? (
    <Badge variant="info">
      <BadgeCheck aria-hidden />
      Verified
    </Badge>
  ) : (
    <Badge variant="outline">Unverified</Badge>
  );
}
