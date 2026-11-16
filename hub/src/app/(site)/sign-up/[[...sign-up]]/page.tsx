import { SignUp } from "@clerk/nextjs";
import { ContextLegend } from "@/components/brand/context-dot";
import { LogoMark } from "@/components/site/logo";

export default function Page() {
  return (
    <div className="grid min-h-[calc(100dvh-3.5rem)] lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-navy p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="bg-dots absolute inset-0 opacity-10" />
        <div className="absolute -right-24 -bottom-24 size-96 rounded-full bg-brand/40 blur-3xl" />
        <LogoMark className="relative size-10" />
        <div className="relative space-y-4">
          <p className="font-display text-4xl leading-tight">The expert in the room, on every page.</p>
          <p className="max-w-md text-white/70">
            Publish your frameworks, rules and playbooks once. Teams apply them to their own Confluence pages through Rovo.
          </p>
          <ContextLegend className="text-white/70" />
        </div>
      </div>
      <div className="flex items-center justify-center bg-surface-sunken px-4 py-16">
        <SignUp />
      </div>
    </div>
  );
}
