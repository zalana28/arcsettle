import { http, createConfig, injected } from "wagmi";
import { defineChain } from "viem";

/**
 * Arc Testnet chain definition.
 * Replace RPC URL and block explorer with real values when available.
 */
export const arcTestnet = defineChain({
  id: 1637450,
  name: "Arc Testnet",
  nativeCurrency: {
    name: "ETH",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc-testnet.arc.money"],
    },
  },
  blockExplorers: {
    default: {
      name: "Arc Explorer",
      url: "https://explorer-testnet.arc.money",
    },
  },
  testnet: true,
});

export const ARC_TESTNET_CHAIN_ID = arcTestnet.id;

export const wagmiConfig = createConfig({
  chains: [arcTestnet],
  connectors: [injected()],
  transports: {
    [arcTestnet.id]: http(),
  },
  ssr: true,
});
