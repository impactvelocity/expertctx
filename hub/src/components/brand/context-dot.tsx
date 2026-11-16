import { cn } from "@/lib/utils";

export const CONTEXTS = {
  team: { label: "Team", className: "bg-ctx-team" },
  goal: { label: "Goal", className: "bg-ctx-goal" },
  expert: { label: "Expert", className: "bg-ctx-expert" },
} as const;

export function ContextDot({ kind, className }: { kind: keyof typeof CONTEXTS; className?: string }) {
  return <span aria-hidden className={cn("inline-block size-2 shrink-0 rounded-full", CONTEXTS[kind].className, className)} />;
}

/** The three contexts as a small legend: ● Team ● Goal ● Expert */
export function ContextLegend({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-3 text-muted-foreground text-xs", className)}>
      {(Object.keys(CONTEXTS) as (keyof typeof CONTEXTS)[]).map((k) => (
        <span key={k} className="inline-flex items-center gap-1.5">
          <ContextDot kind={k} />
          {CONTEXTS[k].label}
        </span>
      ))}
    </span>
  );
}
