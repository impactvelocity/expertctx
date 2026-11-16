import Link from "next/link";
import { ContextLegend } from "@/components/brand/context-dot";
import { Logo } from "./logo";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t bg-surface-sunken">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-xs text-muted-foreground text-sm">
            Rovo knows your team. AI knows the world. ExpertCTX brings the expert.
          </p>
          <ContextLegend />
        </div>
        <FooterColumn
          title="Product"
          links={[
            { href: "/experts", label: "Marketplace" },
            { href: "/install", label: "Install for Confluence" },
            { href: "/#how-it-works", label: "How it works" },
          ]}
        />
        <FooterColumn
          title="Experts"
          links={[
            { href: "/for-experts", label: "For experts" },
            { href: "/studio", label: "Expert studio" },
            { href: "/sign-in", label: "Sign in" },
          ]}
        />
        <FooterColumn
          title="Trust"
          links={[
            { href: "/install#privacy", label: "Privacy and data" },
            { href: "/install#setup", label: "Setup guide" },
          ]}
        />
      </div>
      <div className="border-t">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-5 text-muted-foreground text-xs sm:px-6">
          <span>© 2026 ExpertCTX. Built for Codegeist 2026.</span>
          <span>An independent app built on Atlassian Forge. Not affiliated with Atlassian.</span>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-xs uppercase tracking-wide">{title}</h3>
      <ul className="space-y-2 text-muted-foreground text-sm">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="hover:text-brand">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
