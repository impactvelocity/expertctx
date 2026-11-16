"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createProfileAction } from "@/app/studio/actions";
import { FieldRow } from "./field-row";
import { useToastResult } from "./use-toast-result";

export function NewProfileDialog({ variant = "default" }: { variant?: "default" | "outline" }) {
  const [result, action, pending] = useActionState(createProfileAction, null);
  useToastResult(result);
  return (
    <Dialog>
      <DialogTrigger render={<Button variant={variant} />}>
        <Plus aria-hidden />
        New profile
      </DialogTrigger>
      <DialogPopup>
        <form action={action}>
          <DialogHeader>
            <DialogTitle>New profile</DialogTitle>
            <DialogDescription>One profile for each job you&apos;re great at. You can add knowledge next.</DialogDescription>
          </DialogHeader>
          <DialogPanel className="space-y-4">
            <FieldRow label="Title">
              <Input name="title" placeholder="Launch" required maxLength={60} autoFocus />
            </FieldRow>
            <FieldRow label="Tagline" description="What a team gets from this profile, in one line.">
              <Input name="tagline" placeholder="Getting a product to market without a quiet launch day." maxLength={160} />
            </FieldRow>
          </DialogPanel>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
            <Button type="submit" loading={pending}>
              Create profile
            </Button>
          </DialogFooter>
        </form>
      </DialogPopup>
    </Dialog>
  );
}
