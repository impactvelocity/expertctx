import { FileText, Sparkles } from "lucide-react";
import { LogoMark } from "@/components/site/logo";

/** A static picture of a Rovo chat answer: team pages and expert knowledge, cited side by side. */
export function RovoMock() {
  return (
    <div className="relative">
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-brand/20 via-brand/5 to-transparent blur-2xl" />
      <div className="overflow-hidden rounded-2xl border bg-card shadow-xl shadow-black/5">
        <div className="flex items-center gap-2 border-b bg-muted/60 px-4 py-2.5">
          <div className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-red-400/70" />
            <span className="size-2.5 rounded-full bg-amber-400/70" />
            <span className="size-2.5 rounded-full bg-emerald-400/70" />
          </div>
          <span className="ml-2 text-muted-foreground text-xs">Confluence · Pebblepath · Q1 Launch Plan (draft)</span>
        </div>
        <div className="space-y-4 p-5">
          <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-primary-foreground text-sm">
            Review this page with Dylan&apos;s Launch profile.
          </div>
          <div className="flex gap-3">
            <LogoMark className="size-7 shrink-0" />
            <div className="min-w-0 space-y-3 text-sm">
              <p>
                <span className="font-medium">Verdict: not ready yet.</span> The plan launches to an empty list, which
                breaks Dylan&apos;s first rule.
              </p>
              <ul className="space-y-2">
                <li className="rounded-lg border bg-background px-3 py-2">
                  <span className="font-medium">Start the warm-up now.</span>{" "}
                  <span className="text-muted-foreground">
                    Mitch&apos;s <Cite team>Email playbook</Cite> already has a 340-person newsletter and an unused
                    waitlist form. Per <Cite>Warm-up, open, close</Cite>, that&apos;s 4 weeks you need.
                  </span>
                </li>
                <li className="rounded-lg border bg-background px-3 py-2">
                  <span className="font-medium">Pick one audience.</span>{" "}
                  <span className="text-muted-foreground">
                    Jennifer&apos;s <Cite team>Customer interviews</Cite> point to solo freelancers in year one.{" "}
                    <Cite>Audience before launch day</Cite>.
                  </span>
                </li>
              </ul>
              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                <Sparkles className="size-3.5 text-brand" aria-hidden />
                Turn this into a plan page with owners?
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Cite({ children, team }: { children: React.ReactNode; team?: boolean }) {
  return team ? (
    <span className="inline-flex items-center gap-1 rounded-md bg-sky-500/10 px-1.5 py-0.5 font-medium text-sky-700 text-xs dark:text-sky-300">
      <FileText className="size-3" aria-hidden />
      {children}
    </span>
  ) : (
    <span className="inline-flex items-center rounded-md bg-brand/10 px-1.5 py-0.5 font-medium text-brand text-xs">
      {children}
    </span>
  );
}
