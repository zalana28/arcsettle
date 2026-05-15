"use client";

import { parseUnits } from "viem";
import { writeContract, waitForTransactionReceipt, getAccount } from "@wagmi/core";
import { ERC20_ABI } from "@/lib/erc20";
import {
  ARC_TESTNET_USDC_ADDRESS,
  ARC_TESTNET_USDC_DECIMALS,
  ARC_TESTNET_CHAIN_ID,
} from "@/lib/arc";
import { wagmiConfig } from "@/lib/wagmi";

export type ArcSettlementStatus =
  | "idle"
  | "awaiting_signature"
  | "submitted"
  | "confirming"
  | "confirmed"
  | "recording"
  | "complete"
  | "error";

export interface ArcSettlementState {
  status: ArcSettlementStatus;
  txHash: string | null;
  error: string | null;
}

/**
 * Convert a USDC amount (human-readable) to the smallest unit (6 decimals).
 * Example: 100.50 USDC -> 100500000n
 */
export function parseUsdcAmount(amount: number): bigint {
  return parseUnits(amount.toString(), ARC_TESTNET_USDC_DECIMALS);
}

/**
 * Check if the real Arc settlement feature is enabled via env var.
 */
export function isRealArcSettlementEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_REAL_ARC_SETTLEMENT === "true";
}

/**
 * Validate that the connected wallet is ready for Arc settlement.
 * Returns an error message string if not ready, or null if ready.
 */
export function validateWalletForSettlement(
  connectedAddress: string | undefined,
  expectedPayerAddress: string | undefined,
  chainId: number | undefined
): string | null {
  if (!connectedAddress) {
    return "Please connect your wallet to proceed with settlement.";
  }

  if (chainId !== ARC_TESTNET_CHAIN_ID) {
    return "Please switch to Arc Testnet (chain ID 5042002) to proceed.";
  }

  if (
    expectedPayerAddress &&
    connectedAddress.toLowerCase() !== expectedPayerAddress.toLowerCase()
  ) {
    return `Connected wallet does not match the payer address. Expected: ${expectedPayerAddress.slice(0, 10)}...`;
  }

  return null;
}

/**
 * Execute a USDC ERC-20 transfer on Arc Testnet using the connected wallet.
 *
 * Flow:
 * 1. Wallet signs the ERC-20 transfer transaction
 * 2. Transaction is submitted to Arc Testnet
 * 3. Wait for transaction receipt (confirmation)
 * 4. Return confirmed transaction hash
 */
export async function executeUsdcTransfer(params: {
  toAddress: `0x${string}`;
  amount: number;
  onStatusChange?: (status: ArcSettlementStatus) => void;
}): Promise<{ txHash: `0x${string}` }> {
  const { toAddress, amount, onStatusChange } = params;

  // Verify wallet is connected
  const account = getAccount(wagmiConfig);
  if (!account.address) {
    throw new Error("No wallet connected. Please connect your wallet first.");
  }

  // Convert amount to smallest unit
  const amountInUnits = parseUsdcAmount(amount);

  // Step 1: Request wallet signature for ERC-20 transfer
  onStatusChange?.("awaiting_signature");

  const txHash = await writeContract(wagmiConfig, {
    address: ARC_TESTNET_USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: "transfer",
    args: [toAddress, amountInUnits],
    chainId: ARC_TESTNET_CHAIN_ID,
  });

  // Step 2: Transaction submitted
  onStatusChange?.("submitted");

  // Step 3: Wait for confirmation
  onStatusChange?.("confirming");

  await waitForTransactionReceipt(wagmiConfig, {
    hash: txHash,
    chainId: ARC_TESTNET_CHAIN_ID,
    confirmations: 1,
  });

  // Step 4: Confirmed
  onStatusChange?.("confirmed");

  return { txHash };
}

/**
 * Record a confirmed settlement transaction on the backend.
 */
export async function recordSettlementOnBackend(params: {
  invoiceId: string;
  transactionHash: string;
  fromWallet: string;
  toWallet: string;
  amount: number;
}): Promise<{ success: boolean; error?: string }> {
  const res = await fetch(`/api/invoices/${params.invoiceId}/record-settlement`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      transactionHash: params.transactionHash,
      fromWallet: params.fromWallet,
      toWallet: params.toWallet,
      amount: params.amount,
      chain: "arc_testnet",
    }),
  });

  const data = await res.json();
  return { success: data.success, error: data.error };
}
