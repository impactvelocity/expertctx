import { CheckSquare, ChevronDown, FileText, MoreHorizontal, Sparkles } from "lucide-react";
import { LogoMark } from "@/components/site/logo";
import { cn } from "@/lib/utils";

/**
 * A static product shot: a team's plan page on the left, the ExpertCTX agent
 * on the right, citing the team's pages (teal) and the expert's methods (violet).
 */
export function RovoMock({ className }: { className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <div className="absolute -inset-8 -z-10 rounded-[2.5rem] bg-gradient-to-br from-brand/25 via-ctx-expert/10 to-transparent blur-3xl" />
      <div className="overflow-hidden rounded-xl border bg-card shadow-2xl shadow-navy/10 ring-1 ring-navy/5">
        {/* App bar */}
        <div className="flex h-10 items-center gap-3 border-b bg-surface-sunken px-3">
          <div className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-navy/15" />
            <span className="size-2.5 rounded-full bg-navy/15" />
            <span className="size-2.5 rounded-full bg-navy/15" />
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
            <span className="flex size-4 items-center justify-center rounded-[4px] bg-ctx-team/80 font-semibold text-[9px] text-white">P</span>
            Pebblepath
            <span className="text-muted-foreground/50">/</span>
            Q1 Launch Plan (draft)
          </div>
          <MoreHorizontal className="ml-auto size-4 text-muted-foreground" aria-hidden />
        </div>

        <div className="grid grid-cols-[1fr_1.15fr]">
          {/* The team's page */}
          <div className="space-y-3 border-r p-5">
            <p className="font-display text-lg leading-tight">Q1 Launch Plan (draft)</p>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="size-4 rounded-full bg-ctx-team/30" /> Owner: Alana
            </div>
            <div className="space-y-2 pt-1">
              <p className="font-semibold text-xs">Summary</p>
              <Line w="w-full" />
              <Line w="w-11/12" />
              <p className="pt-1 font-semibold text-xs">Channels</p>
              <div className="rounded-md bg-ctx-goal/20 px-2 py-1 text-[11px] text-warning-foreground ring-1 ring-ctx-goal/40">
                Launch post on social media on March 31
              </div>
              <Line w="w-10/12" />
              <p className="pt-1 font-semibold text-xs">Tasks</p>
              {["Landing page", "Social posts", "Set up ads"].map((t) => (
                <div key={t} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <CheckSquare className="size-3" aria-hidden />
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* The agent panel */}
          <div className="flex flex-col bg-background">
            <div className="flex h-9 items-center gap-2 border-b px-3">
              <LogoMark className="size-5" />
              <span className="font-medium text-xs">ExpertCTX</span>
              <ChevronDown className="size-3 text-muted-foreground" aria-hidden />
            </div>
            <div className="space-y-3 p-3.5 text-[12px] leading-relaxed">
              <div className="ml-auto w-fit max-w-[90%] rounded-lg bg-surface-sunken px-3 py-2 ring-1 ring-border">
                Review this page with Dylan&apos;s Launch profile.
              </div>
              <div className="space-y-2.5">
                <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Sparkles className="size-3 text-brand" aria-hidden />
                  Ran the <Cite kind="expert">Launch readiness review</Cite>
                </p>
                <p>
                  <span className="font-semibold">Not ready yet.</span> You&apos;re about to launch to an empty list.
                </p>
                <Gap n={1} title="Start the warm-up now">
                  Mitch&apos;s <Cite kind="team">Email playbook</Cite> has 340 subscribers and an unused waitlist form.{" "}
                  <Cite kind="expert">Warm-up, open, close</Cite>
                </Gap>
                <Gap n={2} title="One audience, in their words">
                  Jennifer&apos;s <Cite kind="team">Customer interviews</Cite>: solo freelancers, &ldquo;safe to spend&rdquo;.
                </Gap>
                <div className="flex items-center justify-between rounded-md border border-brand/30 bg-brand-soft px-2.5 py-1.5 text-[11px]">
                  <span>Turn this into a plan page with owners?</span>
                  <span className="rounded bg-brand px-1.5 py-0.5 font-medium text-brand-foreground">Create</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Line({ w }: { w: string }) {
  return <div className={cn("h-1.5 rounded-full bg-navy/8", w)} />;
}

function Gap({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2 rounded-md border bg-card px-2.5 py-2">
      <span className="mt-px flex size-4 shrink-0 items-center justify-center rounded-full bg-navy/8 font-semibold text-[10px]">{n}</span>
      <p>
        <span className="font-semibold">{title}.</span> <span className="text-muted-foreground">{children}</span>
      </p>
    </div>
  );
}

export function Cite({ kind, children }: { kind: "team" | "expert"; children: React.ReactNode }) {
  return kind === "team" ? (
    <span className="inline-flex items-center gap-0.5 rounded-[3px] bg-ctx-team/12 px-1 font-medium text-[11px] text-ctx-team">
      <FileText className="size-2.5" aria-hidden />
      {children}
    </span>
  ) : (
    <span className="inline-flex items-center rounded-[3px] bg-ctx-expert/12 px-1 font-medium text-[11px] text-ctx-expert">
      {children}
    </span>
  );
}
