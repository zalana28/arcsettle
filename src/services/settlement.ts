/**
 * Settlement Service - Re-export from new modular architecture.
 *
 * This file maintains backward compatibility with existing imports.
 * The actual implementation now lives in src/services/settlement/
 */
export { settleInvoice } from "./settlement/settlementService";
export type {
  SettlementOrchestrationResult as SettlementResult,
  SettlementInput,
  SettlementProvider,
} from "./settlement/types";
