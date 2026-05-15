import { generateMockTxHash, calculateSettlementFee } from "@/lib/utils";
import { SETTLEMENT_FEE_PERCENT } from "@/lib/constants";
import type { SettlementProvider, SettlementInput, SettlementResult } from "./types";

/**
 * Mock Settlement Provider
 *
 * Simulates on-chain settlement with a 1-second delay and generates
 * a fake transaction hash. Used for development and testing.
 */
export class MockSettlementProvider implements SettlementProvider {
  readonly name = "mock";

  async settleInvoice(input: SettlementInput): Promise<SettlementResult> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Generate mock transaction hash and calculate fee
    const transactionHash = generateMockTxHash();
    const feeAmount = calculateSettlementFee(input.amount, SETTLEMENT_FEE_PERCENT);

    return {
      transactionHash,
      status: "confirmed",
      settledAt: new Date(),
      provider: this.name,
      feeAmount,
    };
  }
}
