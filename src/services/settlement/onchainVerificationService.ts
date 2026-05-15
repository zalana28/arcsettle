import { createPublicClient, http, parseAbi, decodeEventLog } from "viem";
import { defineChain } from "viem";
import {
  ARC_TESTNET_CHAIN_ID,
  ARC_TESTNET_RPC_URL,
  ARC_TESTNET_USDC_ADDRESS,
  ARC_TESTNET_USDC_DECIMALS,
} from "@/lib/arc";
import { parseUnits } from "viem";

const arcTestnetChain = defineChain({
  id: ARC_TESTNET_CHAIN_ID,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: { default: { http: [ARC_TESTNET_RPC_URL] } },
  testnet: true,
});

const publicClient = createPublicClient({
  chain: arcTestnetChain,
  transport: http(ARC_TESTNET_RPC_URL),
});

const TRANSFER_EVENT_ABI = parseAbi([
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]);

export interface VerificationInput {
  transactionHash: `0x${string}`;
  expectedFromWallet: string;
  expectedToWallet: string;
  expectedAmount: number;
  expectedCurrency: string;
  expectedChain: string;
}

export interface VerificationResult {
  verified: boolean;
  error?: string;
  details?: {
    blockNumber: bigint;
    from: string;
    to: string;
    value: bigint;
    contractAddress: string;
  };
}

/**
 * Verify an on-chain settlement transaction on Arc Testnet.
 *
 * Checks:
 * 1. Transaction exists and receipt status is success
 * 2. Transfer event exists from the USDC contract
 * 3. from matches buyer wallet
 * 4. to matches seller wallet
 * 5. value matches invoice amount (6 decimals)
 */
export async function verifySettlementTransaction(
  input: VerificationInput
): Promise<VerificationResult> {
  // Validate inputs
  if (input.expectedCurrency !== "USDC") {
    return { verified: false, error: "Only USDC verification is supported" };
  }

  if (input.expectedChain !== "arc_testnet") {
    return { verified: false, error: "Only arc_testnet chain is supported" };
  }

  if (!/^0x[a-fA-F0-9]{64}$/.test(input.transactionHash)) {
    return { verified: false, error: "Invalid transaction hash format" };
  }

  try {
    // Step 1: Fetch transaction receipt
    const receipt = await publicClient.getTransactionReceipt({
      hash: input.transactionHash,
    });

    if (!receipt) {
      return { verified: false, error: "Transaction receipt not found on Arc Testnet" };
    }

    // Step 2: Verify receipt status
    if (receipt.status !== "success") {
      return { verified: false, error: `Transaction failed on-chain (status: ${receipt.status})` };
    }

    // Step 3: Find Transfer event from USDC contract
    const transferLogs = receipt.logs.filter(
      (log) => log.address.toLowerCase() === ARC_TESTNET_USDC_ADDRESS.toLowerCase()
    );

    if (transferLogs.length === 0) {
      return {
        verified: false,
        error: "No Transfer event found from USDC contract in transaction logs",
      };
    }

    // Step 4: Decode and verify Transfer event
    const expectedAmountInUnits = parseUnits(
      input.expectedAmount.toString(),
      ARC_TESTNET_USDC_DECIMALS
    );

    for (const log of transferLogs) {
      try {
        const decoded = decodeEventLog({
          abi: TRANSFER_EVENT_ABI,
          data: log.data,
          topics: log.topics,
        });

        if (decoded.eventName !== "Transfer") continue;

        const { from, to, value } = decoded.args;

        // Check from matches buyer
        if (from.toLowerCase() !== input.expectedFromWallet.toLowerCase()) {
          continue;
        }

        // Check to matches seller
        if (to.toLowerCase() !== input.expectedToWallet.toLowerCase()) {
          continue;
        }

        // Check value matches expected amount
        if (value !== expectedAmountInUnits) {
          return {
            verified: false,
            error: `Transfer amount mismatch. Expected: ${expectedAmountInUnits.toString()}, Got: ${value.toString()}`,
          };
        }

        // All checks passed
        return {
          verified: true,
          details: {
            blockNumber: receipt.blockNumber,
            from,
            to,
            value,
            contractAddress: log.address,
          },
        };
      } catch {
        // Could not decode this log, skip
        continue;
      }
    }

    return {
      verified: false,
      error: "No matching Transfer event found (from/to/amount did not match expected values)",
    };
  } catch (error) {
    // RPC or network error — fail safely
    const message = error instanceof Error ? error.message : "Unknown verification error";

    // TODO: In production, consider:
    // - Retry logic for transient RPC failures
    // - Queue-based verification for async confirmation
    // - Alert monitoring for repeated verification failures
    return {
      verified: false,
      error: `On-chain verification failed: ${message}`,
    };
  }
}
