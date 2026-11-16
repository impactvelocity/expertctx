"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { ListChecks, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardPanel } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { deletePlaybookAction, savePlaybookAction } from "@/app/studio/actions";
import { Markdown } from "@/components/site/markdown";
import type { Playbook, Profile } from "@/lib/types";
import { FieldRow } from "./field-row";
import { toastResult, useToastResult } from "./use-toast-result";

export function PlaybooksPanel({ profile }: { profile: Profile }) {
  const [editing, setEditing] = useState<Playbook | "new" | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-muted-foreground text-sm">
          A playbook is a procedure the agent runs on a team&apos;s plan, step by step: a launch readiness review, a
          funnel audit.
        </p>
        <Button onClick={() => setEditing("new")}>
          <Plus aria-hidden />
          New playbook
        </Button>
      </div>

      {profile.playbooks.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {profile.playbooks.map((playbook) => (
            <Card key={playbook.id}>
              <CardPanel className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-display text-xl">{playbook.name}</h3>
                    {playbook.whenToUse ? <p className="text-muted-foreground text-sm">{playbook.whenToUse}</p> : null}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon-sm" aria-label="Edit playbook" onClick={() => setEditing(playbook)}>
                      <Pencil aria-hidden />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Delete playbook"
                      disabled={pending}
                      onClick={() => start(async () => toastResult(await deletePlaybookAction(profile.id, playbook.id)))}
                    >
                      <Trash2 aria-hidden />
                    </Button>
                  </div>
                </div>
                <div className="max-h-48 overflow-hidden rounded-lg bg-muted/50 p-3 [mask-image:linear-gradient(black_70%,transparent)]">
                  <Markdown className="text-sm">{playbook.steps}</Markdown>
                </div>
              </CardPanel>
            </Card>
          ))}
        </div>
      ) : (
        <Empty className="rounded-2xl border border-dashed bg-background py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ListChecks aria-hidden />
            </EmptyMedia>
            <EmptyTitle>No playbooks yet</EmptyTitle>
            <EmptyDescription>Write down how you review a plan, so the agent can do it the same way.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" onClick={() => setEditing("new")}>
              <Plus aria-hidden />
              New playbook
            </Button>
          </EmptyContent>
        </Empty>
      )}

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogPopup className="max-w-2xl">
          {editing !== null ? (
            <PlaybookForm
              key={editing === "new" ? "new" : editing.id}
              profileId={profile.id}
              playbook={editing === "new" ? null : editing}
              onDone={() => setEditing(null)}
            />
          ) : null}
        </DialogPopup>
      </Dialog>
    </div>
  );
}

function PlaybookForm({ profileId, playbook, onDone }: { profileId: string; playbook: Playbook | null; onDone: () => void }) {
  const [result, action, pending] = useActionState(savePlaybookAction.bind(null, profileId, playbook?.id ?? null), null);
  useToastResult(result);
  useEffect(() => {
    if (result?.ok) onDone();
  }, [result, onDone]);

  return (
    <form action={action}>
      <DialogHeader>
        <DialogTitle>{playbook ? "Edit playbook" : "New playbook"}</DialogTitle>
        <DialogDescription>The agent follows the steps in order and returns the output you describe.</DialogDescription>
      </DialogHeader>
      <DialogPanel className="space-y-4">
        <FieldRow label="Name">
          <Input name="name" defaultValue={playbook?.name} placeholder="Launch readiness review" required maxLength={80} />
        </FieldRow>
        <FieldRow label="When to use it">
          <Input name="whenToUse" defaultValue={playbook?.whenToUse} placeholder="A team has a draft launch plan and a date." maxLength={500} />
        </FieldRow>
        <FieldRow label="Steps" description="Markdown. Numbered steps work best.">
          <Textarea
            name="steps"
            defaultValue={playbook?.steps}
            rows={9}
            className="font-mono text-xs"
            placeholder={"1. Find the one audience and promise.\n2. Check the list: size, source, warm-up emails.\n3. …"}
            required
          />
        </FieldRow>
        <FieldRow label="Output" description="What the answer should look like.">
          <Textarea
            name="output"
            defaultValue={playbook?.output}
            rows={3}
            placeholder="Verdict (ready / not ready), top 3 gaps with owners, the one number to watch."
          />
        </FieldRow>
      </DialogPanel>
      <DialogFooter>
        <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
        <Button type="submit" loading={pending}>
          Save playbook
        </Button>
      </DialogFooter>
    </form>
  );
}
