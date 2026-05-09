"use client";

import { Fingerprint, Loader2, LogOut } from "lucide-react";
import { useApp } from "@/lib/app/provider";
import { truncateAddress } from "@/lib/utils/format";

interface ConnectButtonProps {
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

export function ConnectButton({
  className = "",
  variant = "default",
  size = "md",
}: ConnectButtonProps) {
  const {
    connect,
    disconnect,
    isConnected,
    isConnecting,
    publicKey,
    availableWallets,
  } = useApp();

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm gap-1.5",
    md: "px-4 py-2.5 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2",
  };

  const variantClasses = {
    default:
      "bg-violet-500 hover:bg-violet-400 text-black font-semibold shadow-lg shadow-violet-500/20",
    outline:
      "bg-transparent border border-white/20 hover:bg-white/5 text-white",
    ghost: "bg-white/5 hover:bg-white/10 text-white",
  };

  const baseClasses = `
    inline-flex items-center justify-center rounded-xl font-medium
    transition-all duration-200 ease-out
    disabled:cursor-not-allowed disabled:opacity-50
    focus-visible:ring-2 focus-visible:ring-violet-300/60
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${className}
  `;

  if (isConnecting) {
    return (
      <button className={baseClasses} disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Connecting...</span>
      </button>
    );
  }

  if (isConnected && publicKey) {
    return (
      <div className="flex items-center gap-2">
        <div className={`${baseClasses} cursor-default`}>
          <div className="h-2 w-2 rounded-full bg-violet-300 animate-pulse" />
          <span className="font-mono">{truncateAddress(publicKey)}</span>
        </div>
        <button
          onClick={disconnect}
          className="rounded-xl bg-white/5 p-2.5 text-white/60 transition-all hover:bg-red-500/20 hover:text-red-400 focus-visible:ring-2 focus-visible:ring-violet-300/60"
          title="Disconnect wallet"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <button onClick={() => void connect()} className={baseClasses}>
      <Fingerprint className="h-4 w-4" />
      <span>{availableWallets.length > 0 ? "Connect Wallet" : "Install Wallet"}</span>
    </button>
  );
}

export function WalletBadge() {
  const { isConnected, publicKey, disconnect, walletLabel } = useApp();

  if (!isConnected || !publicKey) return null;

  return (
    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
      <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-violet-500 to-cyan-500" />
      <span className="text-sm font-mono text-white/80">
        {truncateAddress(publicKey)}
      </span>
      {walletLabel ? (
        <span className="text-xs tracking-tight text-zinc-500">{walletLabel}</span>
      ) : null}
      <button
        onClick={disconnect}
        className="ml-1 text-white/40 transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-violet-300/60"
      >
        <LogOut className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
