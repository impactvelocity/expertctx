"use client";

import { useState, useTransition } from "react";
import { Braces, FileText, ListChecks, Quote, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardPanel, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { previewAction } from "@/app/studio/actions";
import { Markdown } from "@/components/site/markdown";
import type { Profile } from "@/lib/types";

type Preview = Awaited<ReturnType<typeof previewAction>>;

const SUGGESTIONS = [
  "Review our launch plan against our goal",
  "What would you check first?",
  "How should we price the first version?",
];

export function PreviewPanel({ profile }: { profile: Profile }) {
  const [question, setQuestion] = useState(SUGGESTIONS[0]);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [raw, setRaw] = useState(false);
  const [pending, start] = useTransition();

  const run = (q: string) =>
    start(async () => {
      setPreview(await previewAction(profile.id, q));
    });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>See what the agent receives</CardTitle>
          <CardDescription>
            When a team asks in Rovo, the agent calls the hub with their question. This is exactly what comes back.
          </CardDescription>
        </CardHeader>
        <CardPanel className="space-y-3">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              run(question);
            }}
          >
            <Input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask as a team would…" />
            <Button type="submit" loading={pending}>
              <Sparkles aria-hidden />
              Preview
            </Button>
          </form>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                className="rounded-full border px-3 py-1 text-muted-foreground text-xs hover:bg-accent hover:text-foreground"
                onClick={() => {
                  setQuestion(s);
                  run(s);
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </CardPanel>
      </Card>

      {preview ? (
        <div className="space-y-4">
          <div className="flex items-center justify-end">
            <Label className="flex items-center gap-2 text-sm">
              <Switch checked={raw} onCheckedChange={setRaw} />
              <Braces className="size-4" aria-hidden />
              Raw JSON
            </Label>
          </div>
          {raw ? (
            <pre className="max-h-[600px] overflow-auto rounded-xl border bg-card p-4 text-xs">{JSON.stringify(preview, null, 2)}</pre>
          ) : (
            <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Quote className="size-4 text-brand" aria-hidden />
                    Source excerpts
                  </CardTitle>
                  <CardDescription>The passages that best match the question, with citations.</CardDescription>
                </CardHeader>
                <CardPanel className="space-y-3">
                  {preview.sourceExcerpts.length ? (
                    preview.sourceExcerpts.map((e, i) => (
                      <div key={i} className="space-y-1.5 rounded-lg border p-3">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <FileText className="size-3.5 text-muted-foreground" aria-hidden />
                          <span className="font-medium">{e.source}</span>
                          {e.where ? <Badge variant="outline">{e.where}</Badge> : null}
                        </div>
                        <p className="line-clamp-6 whitespace-pre-line text-muted-foreground text-sm">{e.text}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      {"note" in preview && preview.note ? preview.note : "No sources matched. Add sources to quote your own words."}
                    </p>
                  )}
                </CardPanel>
              </Card>
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Structured knowledge</CardTitle>
                    <CardDescription>Always sent in full.</CardDescription>
                  </CardHeader>
                  <CardPanel className="space-y-4">
                    {Object.entries(preview.knowledge).map(([label, body]) => (
                      <details key={label} className="group rounded-lg border p-3">
                        <summary className="cursor-pointer font-medium text-sm">
                          {label}
                          <span className="ml-2 text-muted-foreground text-xs">{String(body).length} chars</span>
                        </summary>
                        <Markdown className="mt-3 text-sm">{String(body) || "_Empty_"}</Markdown>
                      </details>
                    ))}
                  </CardPanel>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ListChecks className="size-4 text-brand" aria-hidden />
                      Playbooks
                    </CardTitle>
                  </CardHeader>
                  <CardPanel>
                    {preview.playbooks.length ? (
                      <ul className="space-y-1 text-sm">
                        {preview.playbooks.map((p) => (
                          <li key={p.name}>{p.name}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground text-sm">None yet</p>
                    )}
                  </CardPanel>
                </Card>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
