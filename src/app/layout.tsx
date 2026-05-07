import type { Metadata } from "next";
import "./globals.css";
import Background from "@/components/Background";
import { AppProvider } from "@/lib/app/provider";

export const metadata: Metadata = {
  title: "Sipher",
  description:
    "Private treasury operations on Solana powered by Cloak. Shield funds, run payouts, swap privately, and export internal audit history.",
  keywords: [
    "Solana",
    "treasury",
    "privacy",
    "cloak",
    "USDC",
    "crypto",
    "payments",
    "private payouts",
    "web3",
  ],
  authors: [{ name: "Sipher" }],
  openGraph: {
    title: "Sipher",
    description: "A privacy-native treasury operations product built on Cloak.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-black text-white antialiased">
        <AppProvider>
          <Background />
          <div className="absolute left-10 top-20 h-2 w-2 rounded-full bg-zinc-600 opacity-20" />
          <div className="absolute right-20 top-40 h-1 w-1 rounded-full bg-zinc-500 opacity-30" />
          <div className="absolute left-1/4 top-80 h-1.5 w-1.5 rounded-full bg-zinc-600 opacity-25" />
          <div className="relative z-10">{children}</div>
        </AppProvider>
      </body>
    </html>
  );
}
