"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast";
import { ExpertAvatar } from "@/components/site/expert-avatar";
import type { Expert } from "@/lib/types";

export function AvatarUpload({ expert }: { expert: Expert }) {
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function upload(file: File) {
    setPending(true);
    const form = new FormData();
    form.set("file", file);
    const response = await fetch("/api/me/avatar", { method: "POST", body: form });
    const json = await response.json().catch(() => ({ ok: false, message: "Upload failed" }));
    setPending(false);
    toastManager.add({ title: json.ok ? "Photo updated" : json.message, type: json.ok ? "success" : "error" });
    if (json.ok) router.refresh();
  }

  return (
    <div className="flex items-center gap-4">
      <ExpertAvatar expert={expert} className="size-16 text-lg" />
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
          e.target.value = "";
        }}
      />
      <Button variant="outline" size="sm" loading={pending} onClick={() => input.current?.click()}>
        <Camera aria-hidden />
        Upload photo
      </Button>
    </div>
  );
}
