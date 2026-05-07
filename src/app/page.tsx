"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Copy,
  Eye,
  Fingerprint,
  Lock,
  Send,
  Shield,
  ShieldCheck,
  Check,
  ArrowRightLeft,
  FileSearch,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

function GlowButton({
  children,
  href = "#",
}: {
  children: React.ReactNode;
  href?: string;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const getBoxShadow = () => {
    if (isPressed) {
      return "0 0 0.6em .25em var(--glow-color), 0 0 2.5em 2em var(--glow-spread-color), inset 0 0 .5em .25em var(--glow-color)";
    }
    if (isHovered) {
      return "0 0 1em .25em var(--glow-color), 0 0 4em 2em var(--glow-spread-color), inset 0 0 .75em .25em var(--glow-color)";
    }
    return "0 0 1em .25em var(--glow-color), 0 0 4em 1em var(--glow-spread-color), inset 0 0 .75em .25em var(--glow-color)";
  };

  return (
    <Link
      href={href}
      className="tracking-tight"
      style={
        {
          "--glow-color": "rgb(217, 176, 255)",
          "--glow-spread-color": "rgba(191, 123, 255, 0.781)",
          "--btn-color": "rgb(100, 61, 136)",
          border: ".25em solid var(--glow-color)",
          padding: "1em 3em",
          color: isHovered ? "var(--btn-color)" : "var(--glow-color)",
          fontSize: "15px",
          fontWeight: "bold",
          backgroundColor: isHovered ? "var(--glow-color)" : "var(--btn-color)",
          borderRadius: "1em",
          boxShadow: getBoxShadow(),
          textShadow: "0 0 .5em var(--glow-color)",
          position: "relative",
          textDecoration: "none",
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
        } as React.CSSProperties
      }
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
    >
      {children}
    </Link>
  );
}

function FeatureCard({
  step,
  title,
  description,
  children,
}: {
  step: number;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <div className="absolute -top-6 left-6 z-30 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-lg font-medium tracking-tight text-zinc-300 shadow-2xl backdrop-blur-sm">
        {step}
      </div>
      <div className="group relative flex min-h-[380px] flex-col overflow-hidden rounded-xl border border-white/10 bg-zinc-950/20 p-8 backdrop-blur-xl transition-all duration-500 hover:scale-[1.02] hover:border-white/20 hover:bg-zinc-900/30 hover:shadow-xl">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(260px 200px at 20% 10%, rgba(255,255,255,0.06), transparent 60%), radial-gradient(420px 320px at 110% 120%, rgba(63,63,70,0.35), transparent 60%)",
          }}
        />
        <div className="relative z-10 mt-6 flex-1">{children}</div>
        <div className="relative z-10 mt-auto">
          <h4 className="text-lg tracking-wide text-white xl:text-xl">{title}</h4>
          <p className="mt-2 text-sm tracking-tight text-zinc-400">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -10% 0px" },
    );

    document.querySelectorAll(".animate-on-scroll").forEach((element) => {
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Header />

      <section className="relative">
        <div className="mx-auto max-w-7xl px-6 pb-16 pt-16 lg:px-8 lg:pt-16">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800/50 bg-zinc-900/30 px-3 py-1 text-xs tracking-tight text-zinc-300 backdrop-blur-xl animate-fade-slide-in">
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-violet-400" />
              Built for Cloak private treasury operations
            </div>
            <h1 className="mt-8 text-5xl font-light tracking-tighter text-white sm:text-7xl lg:text-8xl animate-fade-slide-in">
              Treasury Ops,
              <br />
              <span className="bg-gradient-to-r from-zinc-300 via-white to-zinc-300 bg-clip-text text-transparent">
                Without The Public Trail.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg tracking-tight text-zinc-400 animate-fade-slide-in">
              Shield funds, run private vendor and contractor payouts, swap into
              stablecoins discreetly, and keep finance-grade visibility through
              Cloak viewing-key history.
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center animate-fade-slide-in">
              <GlowButton href="/dashboard">Launch Dashboard</GlowButton>
            </div>
          </div>

          <div className="relative mt-16">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-zinc-800/50 via-zinc-700/50 to-zinc-800/50 blur-2xl" />
            <div className="relative rounded-xl border border-white/10 bg-zinc-950/20 p-4 shadow-2xl backdrop-blur-xl transition-all duration-700 hover:border-white/20 hover:bg-zinc-950/30 animate-fade-slide-in animate-on-scroll">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <aside className="rounded-lg border border-white/10 bg-zinc-900/20 p-4 backdrop-blur-xl transition-all duration-500 hover:border-white/20 hover:bg-zinc-900/30 lg:col-span-5">
                  <div className="mb-3 flex items-center gap-2 text-xs tracking-tight text-zinc-400">
                    <Shield className="h-4 w-4" />
                    <span>Private treasury run</span>
                  </div>
                  <h3 className="text-2xl font-light tracking-tighter text-white">
                    Create Payout Run
                  </h3>
                  <p className="mt-1 text-sm tracking-tight text-zinc-400">
                    Mix SOL and stablecoins without exposing counterparties.
                  </p>

                  <div className="mt-4 space-y-3">
                    <div className="rounded-md border border-white/10 bg-zinc-950/20 p-3 backdrop-blur-sm">
                      <label className="text-xs tracking-tight text-zinc-400">
                        Run size
                      </label>
                      <div className="mt-1 flex items-center gap-2">
                        <input
                          type="text"
                          value="$8,300"
                          readOnly
                          className="flex-1 bg-transparent text-2xl font-light tracking-tight text-white outline-none"
                        />
                        <span className="text-zinc-400">USD</span>
                      </div>
                    </div>

                    <div className="rounded-md border border-white/10 bg-zinc-950/20 p-3 backdrop-blur-sm">
                      <label className="text-xs tracking-tight text-zinc-400">
                        Counterparties
                      </label>
                      <input
                        type="text"
                        value="Nadia, Marcus, Northwind"
                        readOnly
                        className="mt-1 w-full bg-transparent text-sm tracking-tight text-white outline-none"
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-md border border-violet-500/30 bg-violet-500/10 p-3 backdrop-blur-sm">
                      <div className="flex items-center gap-2">
                        <ArrowRightLeft className="h-4 w-4 text-violet-400" />
                        <span className="text-sm tracking-tight text-violet-300">
                          Private swap before payout
                        </span>
                      </div>
                      <span className="text-sm font-medium tracking-tight text-violet-400">
                        Enabled
                      </span>
                    </div>

                    <button className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-white/90 px-4 py-3 text-sm font-medium tracking-tight text-black shadow-lg transition hover:scale-105 hover:bg-white">
                      <Fingerprint className="h-4 w-4" />
                      Approve Treasury Run
                    </button>
                  </div>
                </aside>

                <section className="rounded-lg border border-white/10 bg-zinc-900/20 p-4 backdrop-blur-xl transition-all duration-500 hover:border-white/20 hover:bg-zinc-900/30 lg:col-span-7">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm tracking-tight text-white">
                        Finance Visibility
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-1 text-xs tracking-tight text-violet-400">
                        <Eye className="h-3 w-3" />
                        Viewing key
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl border border-zinc-200 bg-white/95 p-6 text-black shadow-xl backdrop-blur-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-2xl font-light tracking-tighter">
                          Treasury Summary
                        </h2>
                        <div className="mt-1 text-sm tracking-tight text-zinc-600">
                          Internal audit snapshot
                        </div>
                      </div>
                      <div className="rounded-full bg-violet-100 px-3 py-1 text-xs font-medium tracking-tight text-violet-700">
                        Private
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-3">
                      <div className="rounded-xl border border-zinc-200 p-4">
                        <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                          Shielded balance
                        </div>
                        <div className="mt-2 text-2xl font-light tracking-tight text-zinc-900">
                          47.8 SOL
                        </div>
                      </div>
                      <div className="rounded-xl border border-zinc-200 p-4">
                        <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                          Stablecoins
                        </div>
                        <div className="mt-2 text-2xl font-light tracking-tight text-zinc-900">
                          $30,830
                        </div>
                      </div>
                      <div className="rounded-xl border border-zinc-200 p-4">
                        <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                          Q2 export
                        </div>
                        <div className="mt-2 text-2xl font-light tracking-tight text-zinc-900">
                          Ready
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 space-y-3">
                      {[
                        "Shielded operating capital",
                        "SOL to USDC conversion",
                        "Contractor payout run",
                      ].map((label) => (
                        <div
                          key={label}
                          className="flex items-center justify-between rounded-lg border border-zinc-200 px-4 py-3"
                        >
                          <div className="flex items-center gap-3">
                            <ShieldCheck className="h-4 w-4 text-violet-600" />
                            <span className="text-sm tracking-tight text-zinc-900">
                              {label}
                            </span>
                          </div>
                          <Check className="h-4 w-4 text-violet-600" />
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="product" className="px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800/50 bg-zinc-900/30 px-3 py-1 text-xs tracking-tight text-zinc-300 backdrop-blur-xl">
              Privacy-native workflow
            </div>
            <h2 className="mt-6 text-4xl font-light tracking-tight text-white">
              What This Product Actually Does
            </h2>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <FeatureCard
              step={1}
              title="Shield Treasury Capital"
              description="Move operating funds into Cloak before actions hit the public chain."
            >
              <div className="space-y-4">
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    Deposit
                  </div>
                  <div className="mt-2 text-3xl font-light tracking-tight text-white">
                    62.4 SOL
                  </div>
                </div>
                <div className="rounded-xl border border-violet-500/20 bg-violet-500/10 p-4">
                  <div className="flex items-center gap-2 text-sm tracking-tight text-violet-300">
                    <Lock className="h-4 w-4" />
                    UTXO shielded state created
                  </div>
                </div>
              </div>
            </FeatureCard>

            <FeatureCard
              step={2}
              title="Run Private Payouts"
              description="Pay vendors and contractors without broadcasting amounts or counterparties."
            >
              <div className="space-y-4">
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm tracking-tight text-white">
                      April contractor run
                    </span>
                    <span className="text-xs tracking-tight text-violet-300">
                      Processing
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs tracking-tight text-zinc-500">
                    <Send className="h-4 w-4" />
                    3 recipients • mixed asset delivery
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="text-sm tracking-tight text-white">
                    USDC delivered privately after swap
                  </div>
                </div>
              </div>
            </FeatureCard>

            <FeatureCard
              step={3}
              title="Export Audit-Ready History"
              description="Give finance the visibility they need without giving the public the same view."
            >
              <div className="space-y-4">
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center gap-2 text-sm tracking-tight text-white">
                    <FileSearch className="h-4 w-4 text-violet-300" />
                    Viewing-key history
                  </div>
                  <div className="mt-2 text-xs tracking-tight text-zinc-500">
                    Gross, fee, net, signatures, running balance
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center gap-2 text-sm tracking-tight text-white">
                    <Copy className="h-4 w-4 text-violet-300" />
                    CSV export ready
                  </div>
                </div>
              </div>
            </FeatureCard>
          </div>
        </div>
      </section>

      <section id="workflow" className="px-6 pb-16">
        <div className="mx-auto max-w-7xl rounded-3xl border border-white/10 bg-zinc-950/20 p-8 backdrop-blur-xl">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800/50 bg-zinc-900/30 px-3 py-1 text-xs tracking-tight text-zinc-300 backdrop-blur-xl">
              Demo path
            </div>
            <h2 className="mt-6 text-4xl font-light tracking-tight text-white">
              The Winning Demo Story
            </h2>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {[
                "Treasury shields funds into Cloak",
                "Admin creates a private payout run",
                "One recipient gets SOL directly",
                "One recipient gets USDC via private swap",
                "Finance opens the history screen",
                "CSV export proves the workflow is operationally credible",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm tracking-tight text-zinc-300"
                >
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-8">
              <GlowButton href="/dashboard">
                Open Product Shell
                <ArrowUpRight className="h-4 w-4" />
              </GlowButton>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
