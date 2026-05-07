"use client";

import Link from "next/link";
import Image from "next/image";

function XIcon() {
  return (
    <svg
      width="17"
      height="16"
      viewBox="0 0 25 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ color: "rgb(255, 255, 255)" }}
    >
      <path
        d="M14.0324 10.0936L21.3178 1.625H19.5914L13.2655 8.9782L8.21307 1.625H2.38567L10.026 12.7443L2.38567 21.625H4.11216L10.7924 13.8598L16.1282 21.625H21.9556L14.032 10.0936H14.0324ZM11.6678 12.8423L10.8936 11.7351L4.73424 2.92468H7.38603L12.3567 10.0349L13.1309 11.1422L19.5922 20.3844H16.9404L11.6678 12.8427V12.8423Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative mb-12 animate-fade-slide-in animate-on-scroll xl:mb-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/20 backdrop-blur-xl transition-all duration-700 hover:border-white/20 hover:bg-zinc-950/30">
          <div className="grid grid-cols-1 divide-y divide-white/10 animate-fade-slide-in animate-on-scroll md:grid-cols-12 md:divide-x md:divide-y-0">
            <div className="p-8 md:col-span-5">
              <Link href="/" className="mb-4 flex items-center gap-3">
                <Image
                  src="/logo.svg"
                  alt="Sipher"
                  width={60}
                  height={60}
                  className="rounded-lg"
                />
                <span className="text-xs uppercase tracking-[0.24em] text-white/80">
                  Sipher
                </span>
              </Link>
              <p className="max-w-sm text-sm tracking-tight text-zinc-400">
                Privacy-native treasury operations for Solana teams. Shield
                capital, run private payouts, swap discreetly, and export
                finance-ready audit history.
              </p>
            </div>

            <div className="flex items-start px-6 py-6 md:col-span-4 md:bg-zinc-950/30 md:p-8 md:backdrop-blur-xl">
              <ul className="space-y-4">
                <li>
                  <Link
                    href="/dashboard"
                    className="text-lg tracking-tight text-zinc-400 transition-colors hover:text-white"
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/payouts"
                    className="text-lg tracking-tight text-zinc-400 transition-colors hover:text-white"
                  >
                    Payout Runs
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/history"
                    className="text-lg tracking-tight text-zinc-400 transition-colors hover:text-white"
                  >
                    Audit History
                  </Link>
                </li>
                <li>
                  <a
                    href="https://docs.cloak.ag"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg tracking-tight text-zinc-400 transition-colors hover:text-white"
                  >
                    Cloak Docs
                  </a>
                </li>
              </ul>
            </div>

            <div className="px-6 py-6 md:col-span-3 md:bg-zinc-950/30 md:p-8 md:backdrop-blur-xl">
              <a
                href="https://github.com/Pavilion-devs/sipher"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xl tracking-tight text-white hover:opacity-90 sm:text-2xl"
              >
                GitHub
              </a>
              <div className="mt-6 flex items-center gap-4">
                <a
                  href="https://x.com/cloak_ag"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Twitter"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-black/20 text-zinc-500 backdrop-blur-sm transition-colors hover:bg-black/30 hover:text-white"
                >
                  <XIcon />
                </a>
                <a
                  href="https://docs.cloak.ag"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Documentation"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-black/20 text-zinc-500 backdrop-blur-sm transition-colors hover:bg-black/30 hover:text-white"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4 3h11l5 5v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V3zm10 1.5V9h4.5L14 4.5zM8 12h8v1.5H8V12zm0 3h8v1.5H8V15zm0-6h4v1.5H8V9z" />
                  </svg>
                </a>
                <a
                  href="https://github.com/Pavilion-devs/sipher"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-black/20 text-zinc-500 backdrop-blur-sm transition-colors hover:bg-black/30 hover:text-white"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.565 21.799 24 17.302 24 12 24 5.373 18.627 0 12 0z" />
                  </svg>
                </a>
              </div>
              <p className="mt-8 text-sm tracking-tight text-zinc-500">
                © {currentYear} Sipher
              </p>
              <p className="mt-2 text-xs tracking-tight text-zinc-600">
                Built for the Cloak track on Frontier
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
