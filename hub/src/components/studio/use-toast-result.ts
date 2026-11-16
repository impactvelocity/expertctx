"use client";

import { useEffect, useRef } from "react";
import { toastManager } from "@/components/ui/toast";
import type { ActionResult } from "@/app/studio/actions";

/** Show a toast whenever a form action returns a new result. */
export function useToastResult(result: ActionResult | null) {
  const last = useRef<ActionResult | null>(null);
  useEffect(() => {
    if (!result || result === last.current) return;
    last.current = result;
    if (result.ok) {
      if (result.message) toastManager.add({ title: result.message, type: "success" });
    } else {
      toastManager.add({ title: result.message, type: "error" });
    }
  }, [result]);
}

export function toastResult(result: ActionResult) {
  if (result.ok) {
    if (result.message) toastManager.add({ title: result.message, type: "success" });
  } else {
    toastManager.add({ title: result.message, type: "error" });
  }
}
