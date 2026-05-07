import type {
  PublicKey,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";

export type SupportedWalletId = "phantom" | "backpack" | "solflare";

type WalletEvent = "connect" | "disconnect" | "accountChanged";

export interface InjectedWalletProvider {
  publicKey: PublicKey | null;
  isConnected?: boolean;
  isPhantom?: boolean;
  isBackpack?: boolean;
  isSolflare?: boolean;
  connect: (options?: { onlyIfTrusted?: boolean }) => Promise<unknown>;
  disconnect?: () => Promise<void>;
  signTransaction?: <T extends Transaction | VersionedTransaction>(
    transaction: T,
  ) => Promise<T>;
  signMessage?: (
    message: Uint8Array,
  ) => Promise<Uint8Array | { signature: Uint8Array }>;
  on?: (event: WalletEvent, listener: (...args: unknown[]) => void) => void;
  removeListener?: (
    event: WalletEvent,
    listener: (...args: unknown[]) => void,
  ) => void;
}

export interface InjectedWalletDescriptor {
  id: SupportedWalletId;
  name: string;
  installUrl: string;
  provider: InjectedWalletProvider;
}

declare global {
  interface Window {
    solana?: InjectedWalletProvider & {
      providers?: InjectedWalletProvider[];
    };
    phantom?: {
      solana?: InjectedWalletProvider;
    };
    backpack?: {
      solana?: InjectedWalletProvider;
    };
    solflare?: InjectedWalletProvider;
  }
}

const INSTALL_URLS: Record<SupportedWalletId, string> = {
  phantom: "https://phantom.app/download",
  backpack: "https://backpack.app/download",
  solflare: "https://solflare.com/download",
};

function buildDescriptor(
  id: SupportedWalletId,
  name: string,
  provider: InjectedWalletProvider | undefined,
) {
  if (!provider) return null;

  return {
    id,
    name,
    installUrl: INSTALL_URLS[id],
    provider,
  } satisfies InjectedWalletDescriptor;
}

export function getInstalledWallets(): InjectedWalletDescriptor[] {
  if (typeof window === "undefined") return [];

  const wallets: Array<InjectedWalletDescriptor | null> = [
    buildDescriptor(
      "phantom",
      "Phantom",
      window.phantom?.solana ||
        (window.solana?.isPhantom ? window.solana : undefined),
    ),
    buildDescriptor(
      "backpack",
      "Backpack",
      window.backpack?.solana ||
        (window.solana?.isBackpack ? window.solana : undefined),
    ),
    buildDescriptor("solflare", "Solflare", window.solflare),
  ];

  const presentWallets = wallets.filter(
    (wallet): wallet is InjectedWalletDescriptor => wallet !== null,
  );

  return presentWallets.filter(
    (wallet, index, collection) =>
      collection.findIndex((candidate) => candidate.id === wallet.id) === index,
  );
}

export function normalizeSignedMessage(
  value: Uint8Array | { signature: Uint8Array },
) {
  return value instanceof Uint8Array ? value : value.signature;
}

export function getDefaultWalletInstall() {
  return {
    name: "Phantom",
    url: INSTALL_URLS.phantom,
  };
}
