/**
 * Arc Testnet Configuration
 *
 * Centralized configuration for the Arc Testnet chain.
 * Used by both the wagmi client-side config and the server-side
 * settlement provider.
 */

export const ARC_TESTNET_CHAIN_ID = 5042002;
export const ARC_TESTNET_RPC_URL = "https://rpc.testnet.arc.network";
export const ARC_TESTNET_EXPLORER_URL = "https://testnet.arcscan.app";

/**
 * USDC Token Address on Arc Testnet.
 */
export const ARC_TESTNET_USDC_ADDRESS: `0x${string}` = "0x3600000000000000000000000000000000000000";

/**
 * USDC uses 6 decimals (standard ERC-20 USDC convention).
 * 1 USDC = 1_000_000 units (10^6).
 */
export const ARC_TESTNET_USDC_DECIMALS = 6;

/**
 * Helper to check if the Arc USDC token address is configured.
 */
export function isArcUsdcConfigured(): boolean {
  return ARC_TESTNET_USDC_ADDRESS.length > 0;
}

/**
 * Build a transaction explorer URL for a given hash.
 */
export function getExplorerTxUrl(txHash: string): string {
  return `${ARC_TESTNET_EXPLORER_URL}/tx/${txHash}`;
}
