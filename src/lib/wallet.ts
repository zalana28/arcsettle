/**
 * Shared wallet address utilities.
 */

/**
 * Normalize a wallet address to lowercase for consistent comparison.
 */
export function normalizeWalletAddress(address: string): string {
  return address.toLowerCase().trim();
}

/**
 * Check if a string is a valid EVM (Ethereum-compatible) address.
 * Must be 0x-prefixed, followed by exactly 40 hex characters.
 */
export function isValidEvmAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Check if two wallet addresses are the same (case-insensitive).
 * Returns false if either address is null/undefined/empty.
 */
export function isSameWalletAddress(
  a: string | null | undefined,
  b: string | null | undefined
): boolean {
  if (!a || !b) return false;
  return normalizeWalletAddress(a) === normalizeWalletAddress(b);
}
