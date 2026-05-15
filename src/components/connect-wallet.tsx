"use client";

import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from "wagmi";
import { ARC_TESTNET_CHAIN_ID } from "@/lib/wagmi";
import { useEffect, useState } from "react";

export function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [hasSaved, setHasSaved] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Save wallet address to company profile when connected
  useEffect(() => {
    if (isConnected && address && !hasSaved) {
      fetch("/api/auth/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: address }),
      }).then(() => setHasSaved(true));
    }
  }, [isConnected, address, hasSaved]);

  // Reset saved state on disconnect
  useEffect(() => {
    if (!isConnected) {
      setHasSaved(false);
    }
  }, [isConnected]);

  if (!mounted) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-9 w-36 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    );
  }

  const isWrongNetwork = isConnected && chainId !== ARC_TESTNET_CHAIN_ID;

  if (!isConnected) {
    return (
      <button
        onClick={() => connect({ connector: connectors[0] })}
        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
      >
        <WalletIcon />
        Connect Wallet
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* Network status */}
      {isWrongNetwork ? (
        <button
          onClick={() => switchChain({ chainId: ARC_TESTNET_CHAIN_ID })}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-lg hover:bg-red-100 transition-colors"
        >
          <span className="w-2 h-2 rounded-full bg-red-500" />
          Wrong Network — Switch to Arc Testnet
        </button>
      ) : (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-medium rounded-lg">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          Arc Testnet
        </div>
      )}

      {/* Wallet address */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-lg">
        <WalletIcon className="w-3.5 h-3.5 text-gray-500" />
        <span className="text-xs font-mono text-gray-700">
          {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ""}
        </span>
      </div>

      {/* Disconnect */}
      <button
        onClick={() => disconnect()}
        className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        title="Disconnect wallet"
      >
        Disconnect
      </button>
    </div>
  );
}

function WalletIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
      />
    </svg>
  );
}
