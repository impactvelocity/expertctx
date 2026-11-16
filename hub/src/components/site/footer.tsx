import Link from "next/link";
import { Logo } from "./logo";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-muted-foreground text-sm">
            Rovo knows your team. AI knows the world. ExpertCTX brings the expert.
          </p>
        </div>
        <FooterColumn
          title="Teams"
          links={[
            { href: "/experts", label: "Browse experts" },
            { href: "/install", label: "Install for Confluence" },
            { href: "/#how-it-works", label: "How it works" },
          ]}
        />
        <FooterColumn
          title="Experts"
          links={[
            { href: "/studio", label: "Become an expert" },
            { href: "/#for-experts", label: "What you can add" },
            { href: "/sign-in", label: "Sign in" },
          ]}
        />
        <FooterColumn
          title="Trust"
          links={[
            { href: "/install#privacy", label: "What data moves" },
            { href: "/install#setup", label: "Setup for judges" },
          ]}
        />
      </div>
      <div className="border-t">
        <p className="mx-auto max-w-6xl px-4 py-5 text-muted-foreground text-xs sm:px-6">
          Built for Codegeist 2026. ExpertCTX is an independent app and is not affiliated with Atlassian.
        </p>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div className="space-y-3">
      <h3 className="font-medium text-sm">{title}</h3>
      <ul className="space-y-2 text-muted-foreground text-sm">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="hover:text-foreground">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
