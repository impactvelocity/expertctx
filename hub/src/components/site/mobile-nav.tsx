"use client";

import Link from "next/link";
import { Menu as MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Menu, MenuItem, MenuPopup, MenuTrigger } from "@/components/ui/menu";

const LINKS = [
  { href: "/experts", label: "Marketplace" },
  { href: "/install", label: "For teams" },
  { href: "/for-experts", label: "For experts" },
  { href: "/studio", label: "Studio" },
];

export function MobileNav() {
  return (
    <Menu>
      <MenuTrigger render={<Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu" />}>
        <MenuIcon aria-hidden />
      </MenuTrigger>
      <MenuPopup align="start">
        {LINKS.map((link) => (
          <MenuItem key={link.href} render={<Link href={link.href} />}>
            {link.label}
          </MenuItem>
        ))}
      </MenuPopup>
    </Menu>
  );
}
