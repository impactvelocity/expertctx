import { CheckSquare, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";
import { Cite } from "./rovo-mock";

function Frame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-xl border bg-card p-5 shadow-xl shadow-navy/5", className)}>{children}</div>
  );
}

/** A plan page the agent wrote: tasks with owners and the reason for each. */
export function PlanPageMock() {
  const tasks = [
    { who: "Mitch", tone: "bg-ctx-team/25", task: "Turn on the waitlist form and send warm-up email 1", why: "wrote Email playbook" },
    { who: "Jennifer", tone: "bg-ctx-expert/25", task: "Rewrite the headline with interview quotes", why: "ran the interviews" },
    { who: "Kevin", tone: "bg-ctx-goal/40", task: "Set the founding-member price and its deadline", why: "owns Pricing options" },
    { who: "Alana", tone: "bg-brand/25", task: "Watch the one number: paid signups, daily", why: "owns the goal" },
  ];
  return (
    <Frame>
      <p className="font-display text-lg">Launch plan: Pebblepath 1.0</p>
      <p className="mb-4 text-muted-foreground text-xs">Reviewed with Dylan Jones · Launch</p>
      <div className="mb-3 rounded-md border-l-2 border-ctx-expert bg-ctx-expert/6 px-3 py-2 text-xs">
        From <Cite kind="expert">Warm-up, open, close</Cite>: four weeks of warm-up before doors open.
      </div>
      <ul className="space-y-2">
        {tasks.map((t) => (
          <li key={t.task} className="flex items-start gap-2.5 text-sm">
            <CheckSquare className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="flex-1">
              {t.task}{" "}
              <span className={cn("inline-flex items-center rounded-full px-1.5 font-medium text-xs", t.tone)}>@{t.who}</span>
              <span className="block text-muted-foreground text-xs">because they {t.why}</span>
            </span>
          </li>
        ))}
      </ul>
    </Frame>
  );
}

/** A playbook, as the expert writes it in the studio. */
export function PlaybookMock() {
  const steps = [
    "Name the one audience and promise",
    "Check the list: size, source, warm-up emails",
    "Walk warm-up, open and close",
    "Find the one number and who watches it",
    "Match every gap to the teammate who knows it",
  ];
  return (
    <Frame>
      <div className="mb-4 flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-md bg-ctx-expert/12 text-ctx-expert">
          <ListChecks className="size-4" aria-hidden />
        </div>
        <div>
          <p className="font-medium text-sm">Launch readiness review</p>
          <p className="text-muted-foreground text-xs">When a team has a draft launch plan and a date</p>
        </div>
      </div>
      <ol className="space-y-2">
        {steps.map((s, i) => (
          <li key={s} className="flex items-center gap-2.5 rounded-md border bg-background px-3 py-2 text-sm">
            <span className="flex size-5 items-center justify-center rounded-full bg-ctx-expert font-semibold text-[11px] text-white">
              {i + 1}
            </span>
            {s}
          </li>
        ))}
      </ol>
    </Frame>
  );
}

/** Where the three contexts come from, meeting in one answer. */
export function ContextsDiagram() {
  const items = [
    { kind: "Team", tone: "border-ctx-team/40 bg-ctx-team/8", dot: "bg-ctx-team", body: "Your pages, owners and who wrote what", from: "Confluence" },
    { kind: "Goal", tone: "border-ctx-goal/50 bg-ctx-goal/10", dot: "bg-ctx-goal", body: "The plan or brief you're looking at", from: "The page you're on" },
    { kind: "Expert", tone: "border-ctx-expert/40 bg-ctx-expert/8", dot: "bg-ctx-expert", body: "Frameworks, rules, red flags, playbooks", from: "ExpertCTX" },
  ];
  return (
    <div className="grid items-center gap-4 lg:grid-cols-[1fr_auto_1fr]">
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.kind} className={cn("rounded-xl border p-4", item.tone)}>
            <div className="flex items-center gap-2">
              <span className={cn("size-2.5 rounded-full", item.dot)} />
              <p className="font-semibold">{item.kind}</p>
              <span className="ml-auto text-muted-foreground text-xs">{item.from}</span>
            </div>
            <p className="mt-1 text-muted-foreground text-sm">{item.body}</p>
          </div>
        ))}
      </div>
      <svg viewBox="0 0 80 200" className="mx-auto hidden h-56 w-20 lg:block" aria-hidden>
        <path d="M0 35 C40 35 40 100 80 100" className="fill-none stroke-ctx-team" strokeWidth="2" strokeDasharray="4 4" />
        <path d="M0 100 L80 100" className="fill-none stroke-ctx-goal" strokeWidth="2" strokeDasharray="4 4" />
        <path d="M0 165 C40 165 40 100 80 100" className="fill-none stroke-ctx-expert" strokeWidth="2" strokeDasharray="4 4" />
      </svg>
      <div className="rounded-xl border bg-card p-5 shadow-xl shadow-navy/5">
        <p className="text-muted-foreground text-xs uppercase tracking-wide">One answer</p>
        <p className="mt-1 font-display text-xl">Specific to your team, in the expert&apos;s judgment</p>
        <p className="mt-3 text-muted-foreground text-sm">
          Every point names its sources: <Cite kind="team">your page</Cite> and <Cite kind="expert">the expert&apos;s method</Cite>.
          Generic advice that ignores your pages doesn&apos;t make it through.
        </p>
      </div>
    </div>
  );
}
