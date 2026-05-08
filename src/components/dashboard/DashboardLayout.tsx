"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  Home,
  Layers3,
  LogOut,
  ScrollText,
  Settings,
  Shield,
  X,
} from "lucide-react";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { useApp } from "@/lib/app/provider";

const sidebarItems = [
  { icon: Home, label: "Overview", href: "/dashboard" },
  { icon: Layers3, label: "Payouts", href: "/dashboard/payouts" },
  { icon: ScrollText, label: "History", href: "/dashboard/history" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

function Sidebar({ disconnect }: { disconnect: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-white/10 bg-zinc-950/80 backdrop-blur-xl">
      <div className="border-b border-white/10 p-6">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.svg"
            alt="Sipher"
            width={120}
            height={32}
            className="h-10 w-auto rounded-lg"
            priority
          />
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300 ${
                isActive
                  ? "border border-violet-500/20 bg-violet-500/10 text-violet-300"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-sm font-medium tracking-tight">
                {item.label}
              </span>
              {isActive ? <ChevronRight className="ml-auto h-4 w-4" /> : null}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-white/10 p-4">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-zinc-400 transition-all duration-300 hover:bg-white/5 hover:text-white"
        >
          <Home className="h-5 w-5" />
          <span className="text-sm font-medium tracking-tight">Back to Home</span>
        </Link>
        <button
          onClick={disconnect}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-zinc-400 transition-all duration-300 hover:bg-red-500/10 hover:text-red-300"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-sm font-medium tracking-tight">Disconnect</span>
        </button>
      </div>
    </aside>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isConnected, disconnect } = useApp();

  if (!isConnected) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="mx-auto max-w-md px-6 text-center">
          <div className="mb-8">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-violet-500/10">
              <Shield className="h-10 w-10 text-violet-300" />
            </div>
            <h1 className="mb-3 text-3xl font-light tracking-tight text-white">
              Connect Treasury Wallet
            </h1>
            <p className="tracking-tight text-zinc-400">
              Connect a wallet with message signing so this shell can shield funds,
              run private payouts, and scan Cloak history for audit export.
            </p>
          </div>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <ConnectButton />
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm tracking-tight text-zinc-400 transition-colors hover:text-white"
            >
              <Home className="h-4 w-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar disconnect={disconnect} />
      <main className="ml-64 flex-1 p-8">{children}</main>
    </div>
  );
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative mx-4 max-h-[90vh] w-full max-w-4xl overflow-auto rounded-2xl border border-white/10 bg-zinc-950/95 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-white/10 p-6">
          <h2 className="text-xl font-light tracking-tight text-white">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 transition-colors hover:bg-white/5"
          >
            <X className="h-5 w-5 text-zinc-400" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
