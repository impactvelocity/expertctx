import Link from "next/link";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Logo } from "./logo";
import { MobileNav } from "./mobile-nav";
import { NavLinks } from "./nav-links";

export function SiteHeader({ app = false }: { app?: boolean }) {
  return (
    <header className="sticky top-0 z-40 h-14 border-b bg-background/90 backdrop-blur-md">
      <div className={app ? "flex h-full items-center gap-5 px-4 sm:px-5" : "mx-auto flex h-full max-w-7xl items-center gap-5 px-4 sm:px-6"}>
        <MobileNav />
        <Logo />
        <NavLinks />
        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/experts"
            className="hidden h-8 w-56 items-center gap-2 rounded-md border bg-surface-sunken px-2.5 text-muted-foreground text-sm transition-colors hover:border-input hover:bg-background lg:flex"
          >
            <Search className="size-4" aria-hidden />
            Find an expert
            <Kbd className="ml-auto">/</Kbd>
          </Link>
          <Show when="signed-out">
            <SignInButton>
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </SignInButton>
            <Button size="sm" render={<Link href="/install" />}>
              Get the app
            </Button>
          </Show>
          <Show when="signed-in">
            <UserButton />
          </Show>
        </div>
      </div>
    </header>
  );
}
