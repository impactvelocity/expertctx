import Link from "next/link";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Logo } from "./logo";

const NAV = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/experts", label: "Marketplace" },
  { href: "/install", label: "Install" },
  { href: "/#for-experts", label: "For experts" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Button key={item.href} variant="ghost" size="sm" render={<Link href={item.href} />}>
              {item.label}
            </Button>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Show when="signed-out">
            <SignInButton>
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </SignInButton>
            <Button size="sm" render={<Link href="/studio" />}>
              Become an expert
            </Button>
          </Show>
          <Show when="signed-in">
            <Button variant="outline" size="sm" render={<Link href="/studio" />}>
              Studio
            </Button>
            <UserButton />
          </Show>
        </div>
      </div>
    </header>
  );
}
