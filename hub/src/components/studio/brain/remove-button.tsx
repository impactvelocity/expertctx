"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Removing a source can't be undone, so the first click only arms the button
 * and the second one removes. It disarms itself after a few seconds.
 */
export function RemoveButton({
  onRemove,
  label,
  compact = false,
  disabled = false,
}: {
  onRemove: () => void;
  label: string;
  compact?: boolean;
  disabled?: boolean;
}) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const timer = setTimeout(() => setArmed(false), 3500);
    return () => clearTimeout(timer);
  }, [armed]);

  if (armed) {
    return (
      <Button data-armed variant="destructive" size={compact ? "xs" : "default"} disabled={disabled} onClick={onRemove} onBlur={() => setArmed(false)} autoFocus>
        <Trash2 aria-hidden />
        Remove for good
      </Button>
    );
  }
  return compact ? (
    <Button variant="outline" size="icon-xs" aria-label={label} disabled={disabled} onClick={() => setArmed(true)}>
      <Trash2 aria-hidden />
    </Button>
  ) : (
    <Button variant="ghost" disabled={disabled} className="text-destructive-foreground" onClick={() => setArmed(true)}>
      <Trash2 aria-hidden />
      Remove
    </Button>
  );
}
