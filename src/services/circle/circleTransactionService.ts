/**
 * Circle Transaction Service — Server-Side Only
 *
 * Provides server-side helpers for creating and managing Circle
 * developer-controlled wallet transactions on Arc Testnet.
 *
 * IMPORTANT: This module must only be imported in server-side code.
 * Circle API key and entity secret are never exposed to the frontend.
 */

import { getCircleDeveloperWalletsClient, isCircleSdkConfigured } from "./circleDeveloperWalletsSdk";
import { randomUUID } from "crypto";

const DEFAULT_BLOCKCHAIN = "ARC-TESTNET";

export interface CircleTransferInput {
  sourceWalletId: string;
  destinationAddress: string;
  amount: string;
  tokenId?: string;
  blockchain?: string;
  currency?: string;
  idempotencyKey?: string;
}

export interface CircleTransferResult {
  success: boolean;
  data?: {
    transactionId: string;
    state: string;
    transactionType?: string;
    sourceAddress?: string;
    destinationAddress?: string;
    amounts?: string[];
    blockchain?: string;
  };
  error?: string;
  status?: number;
}

export interface CircleTransactionStatusResult {
  success: boolean;
  data?: {
    id: string;
    state: string;
    txHash?: string;
    transactionType?: string;
    sourceAddress?: string;
    destinationAddress?: string;
    amounts?: string[];
    blockchain?: string;
    createDate?: string;
    updateDate?: string;
  };
  error?: string;
  status?: number;
}

export interface CircleFeeEstimateResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

/**
 * Validate transfer input before sending to Circle.
 */
function validateTransferInput(input: CircleTransferInput): string | null {
  if (!input.sourceWalletId) return "sourceWalletId is required";
  if (!input.destinationAddress || !/^0x[a-fA-F0-9]{40}$/.test(input.destinationAddress)) {
    return "destinationAddress must be a valid EVM address (0x + 40 hex chars)";
  }
  const amount = parseFloat(input.amount);
  if (isNaN(amount) || amount <= 0) return "amount must be a positive number";
  return null;
}

/**
 * Estimate transfer fee for a Circle transaction.
 */
export async function estimateCircleTransferFee(
  input: CircleTransferInput
): Promise<CircleFeeEstimateResult> {
  if (!isCircleSdkConfigured()) {
    return { success: false, error: "Circle SDK is not configured" };
  }

  const validationError = validateTransferInput(input);
  if (validationError) return { success: false, error: validationError };

  try {
    const client = getCircleDeveloperWalletsClient();

    const response = await client.estimateTransferFee({
      amounts: [input.amount],
      destinationAddress: input.destinationAddress,
      walletId: input.sourceWalletId,
      tokenId: input.tokenId,
      blockchain: (input.blockchain || DEFAULT_BLOCKCHAIN) as never,
    } as never);

    return { success: true, data: response.data };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Fee estimation failed";
    return { success: false, error: msg };
  }
}

/**
 * Create a Circle transfer transaction from a developer-controlled wallet.
 */
export async function createCircleTransferTransaction(
  input: CircleTransferInput
): Promise<CircleTransferResult> {
  if (!isCircleSdkConfigured()) {
    return { success: false, error: "Circle SDK is not configured" };
  }

  const validationError = validateTransferInput(input);
  if (validationError) return { success: false, error: validationError };

  const blockchain = input.blockchain || DEFAULT_BLOCKCHAIN;

  try {
    const client = getCircleDeveloperWalletsClient();

    const response = await client.createTransaction({
      idempotencyKey: input.idempotencyKey || randomUUID(),
      amounts: [input.amount],
      destinationAddress: input.destinationAddress,
      walletId: input.sourceWalletId,
      tokenId: input.tokenId || undefined,
      blockchain: blockchain as never,
      feeLevel: "MEDIUM" as never,
    } as never);

    const responseData = response.data as Record<string, unknown> | undefined;
    const tx = (responseData?.transaction || responseData) as Record<string, unknown> | undefined;

    if (!tx) {
      return { success: false, error: "No transaction returned from Circle" };
    }

    return {
      success: true,
      data: {
        transactionId: (tx.id as string) || "",
        state: (tx.state as string) || "INITIATED",
        transactionType: (tx.transactionType as string) || "TRANSFER",
        sourceAddress: (tx.sourceAddress as string) || undefined,
        destinationAddress: (tx.destinationAddress as string) || input.destinationAddress,
        amounts: (tx.amounts as string[]) || [input.amount],
        blockchain: (tx.blockchain as string) || blockchain,
      },
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);

    if (
      msg.toLowerCase().includes("blockchain") ||
      msg.toLowerCase().includes("not supported") ||
      msg.toLowerCase().includes("invalid")
    ) {
      return {
        success: false,
        error:
          `Circle transaction creation on ${blockchain} is not enabled for this Circle account. ` +
          `Original error: ${msg}`,
      };
    }

    return { success: false, error: msg };
  }
}

/**
 * Get the status of a Circle transaction by ID.
 */
export async function getCircleTransactionStatus(
  transactionId: string
): Promise<CircleTransactionStatusResult> {
  if (!isCircleSdkConfigured()) {
    return { success: false, error: "Circle SDK is not configured" };
  }

  if (!transactionId) {
    return { success: false, error: "transactionId is required" };
  }

  try {
    const client = getCircleDeveloperWalletsClient();

    const response = await client.getTransaction({ id: transactionId });

    const responseData = response.data as Record<string, unknown> | undefined;
    const tx = (responseData?.transaction || responseData) as Record<string, unknown> | undefined;

    if (!tx) {
      return { success: false, error: "Transaction not found", status: 404 };
    }

    return {
      success: true,
      data: {
        id: (tx.id as string) || transactionId,
        state: (tx.state as string) || "UNKNOWN",
        txHash: (tx.txHash as string) || undefined,
        transactionType: (tx.transactionType as string) || undefined,
        sourceAddress: (tx.sourceAddress as string) || undefined,
        destinationAddress: (tx.destinationAddress as string) || undefined,
        amounts: (tx.amounts as string[]) || undefined,
        blockchain: (tx.blockchain as string) || undefined,
        createDate: (tx.createDate as string) || undefined,
        updateDate: (tx.updateDate as string) || undefined,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get transaction status",
    };
  }
}
