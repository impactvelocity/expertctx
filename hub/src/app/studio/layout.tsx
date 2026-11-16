import { SiteHeader } from "@/components/site/header";

export default function StudioLayout({ children }: LayoutProps<"/studio">) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">{children}</div>
      </main>
    </>
  );
}
