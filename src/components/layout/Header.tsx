"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { ConnectButton } from "@/components/wallet/ConnectButton";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/#product", label: "Product" },
  { href: "/#workflow", label: "Workflow" },
  { href: "/dashboard", label: "Dashboard" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="mb-8 mt-8 px-6 xl:my-8">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-6 rounded-3xl border border-zinc-800 px-6 py-3 lg:border-white/10 lg:bg-zinc-950/40 lg:px-6 lg:pb-2 lg:pr-2 lg:pt-2 lg:backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.svg"
            alt="Sipher"
            width={120}
            height={32}
            className="h-8 w-auto rounded-lg"
          />
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm tracking-tight text-zinc-400 transition-colors hover:text-white xl:text-base"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <ConnectButton variant="outline" />
        </div>

        <button
          onClick={() => setMobileMenuOpen((value) => !value)}
          className="rounded-lg border border-white/10 bg-white/5 p-2 text-white md:hidden"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {mobileMenuOpen ? (
        <div className="absolute left-4 right-4 top-24 z-50 rounded-2xl border border-white/10 bg-zinc-950/95 px-4 py-6 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-4 py-3 text-base tracking-tight text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 border-t border-white/10 pt-4">
              <ConnectButton className="w-full justify-center" variant="outline" />
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
