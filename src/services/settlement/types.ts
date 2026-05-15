/**
 * Settlement Provider Architecture - Type Definitions
 *
 * This module defines the interfaces that all settlement providers must implement.
 * The architecture allows swapping between mock, Arc Wallet, or any future
 * settlement provider without changing the orchestration logic.
 */

export interface SettlementInput {
  invoiceId: string;
  sellerWalletAddress: string;
  buyerWalletAddress: string;
  amount: number;
  currency: string;
  chain: string;
  metadata?: Record<string, unknown>;
}

export interface SettlementResult {
  transactionHash: string | null;
  status: "confirmed" | "pending" | "failed";
  settledAt: Date | null;
  provider: string;
  feeAmount: number;
}

export interface SettlementProvider {
  readonly name: string;

  /**
   * Execute settlement for the given input.
   * Returns a result with transaction details on success.
   * Throws an error on failure.
   */
  settleInvoice(input: SettlementInput): Promise<SettlementResult>;
}

/**
 * Legacy result format used by the orchestration layer.
 * Maintained for backward compatibility with existing API routes.
 */
export interface SettlementOrchestrationResult {
  success: boolean;
  transactionHash: string | null;
  fee: number;
  error?: string;
}
