"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Menu, MenuItem, MenuPopup, MenuTrigger } from "@/components/ui/menu";
import { Switch } from "@/components/ui/switch";
import { deleteProfileAction, setPublishedAction } from "@/app/studio/actions";
import { toastResult } from "./use-toast-result";

export function PublishControls({ profileId, published }: { profileId: string; published: boolean }) {
  const [pending, start] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <Label className="flex h-9 cursor-pointer items-center gap-2.5 rounded-lg border bg-background px-3 text-sm">
        <Switch
          checked={published}
          disabled={pending}
          onCheckedChange={(next) =>
            start(async () => {
              const result = await setPublishedAction(profileId, next);
              toastResult(result);
              router.refresh();
            })
          }
        />
        {published ? "Published" : "Publish"}
      </Label>
      <Menu>
        <MenuTrigger render={<Button variant="outline" size="icon" aria-label="More" />}>
          <MoreHorizontal aria-hidden />
        </MenuTrigger>
        <MenuPopup align="end">
          <MenuItem variant="destructive" onClick={() => setConfirmDelete(true)}>
            <Trash2 aria-hidden />
            Delete profile
          </MenuItem>
        </MenuPopup>
      </Menu>
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this profile?</AlertDialogTitle>
            <AlertDialogDescription>
              Its knowledge, playbooks and sources are removed, and teams can no longer ask it. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="ghost" />}>Cancel</AlertDialogClose>
            <Button
              variant="destructive"
              loading={pending}
              onClick={() =>
                start(async () => {
                  const result = await deleteProfileAction(profileId);
                  if (result) toastResult(result);
                })
              }
            >
              Delete profile
            </Button>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </div>
  );
}
