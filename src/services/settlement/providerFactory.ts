import type { SettlementProvider } from "./types";
import { MockSettlementProvider } from "./mockSettlementProvider";
import { ArcWalletSettlementProvider } from "./arcWalletSettlementProvider";

export type SettlementProviderName = "mock" | "arc-wallet";

/**
 * Create a settlement provider based on the SETTLEMENT_PROVIDER environment variable.
 *
 * Supported values:
 * - "mock" (default): Uses MockSettlementProvider with fake tx hashes
 * - "arc-wallet": Uses ArcWalletSettlementProvider (not yet functional)
 */
export function createSettlementProvider(): SettlementProvider {
  const providerName = (process.env.SETTLEMENT_PROVIDER || "mock") as SettlementProviderName;

  switch (providerName) {
    case "arc-wallet":
      return new ArcWalletSettlementProvider();
    case "mock":
    default:
      return new MockSettlementProvider();
  }
}
