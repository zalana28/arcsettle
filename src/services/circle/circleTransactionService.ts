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

// ─── Safe Error Parsing ───────────────────────────────────────────────────────

/**
 * Known Circle error patterns mapped to user-friendly messages.
 */
const CIRCLE_ERROR_PATTERNS: Array<{ pattern: RegExp; message: string }> = [
  { pattern: /insufficient.*balance|not enough.*funds|balance.*too low/i, message: "Insufficient wallet balance for this transfer" },
  { pattern: /unsupported.*token|token.*not.*supported|invalid.*token.*id/i, message: "Unsupported or invalid token for this transfer" },
  { pattern: /unsupported.*blockchain|blockchain.*not.*supported|chain.*not.*available/i, message: "Unsupported blockchain for this transfer" },
  { pattern: /invalid.*token.*id|token.*id.*not.*found/i, message: "Invalid token ID" },
  { pattern: /wallet.*not.*funded|wallet.*has.*no.*balance|no.*funds/i, message: "Wallet is not funded" },
  { pattern: /wallet.*not.*found|invalid.*wallet/i, message: "Wallet not found or invalid" },
  { pattern: /address.*invalid|invalid.*address|malformed.*address/i, message: "Invalid destination address" },
];

/**
 * Safely extract an error message from a Circle SDK error without
 * exposing sensitive data (API keys, auth headers, entity secret, ciphertext,
 * raw Axios config).
 *
 * Circle SDK errors may have various shapes:
 * - Standard Error with .message
 * - Axios-like with .response.data.message
 * - Nested .error.message or .error.code
 * - Plain string
 *
 * This function NEVER accesses .config, .request, or authorization-related fields.
 */
function parseCircleError(error: unknown): { message: string; status?: number } {
  // Fallback
  const fallback = { message: "Circle API request failed" };

  if (!error) return fallback;

  // Plain string
  if (typeof error === "string") {
    return { message: sanitizeErrorMessage(error) };
  }

  if (typeof error !== "object") return fallback;

  const err = error as Record<string, unknown>;

  // Try to extract HTTP status from response (safely, without touching config)
  let status: number | undefined;
  if (err.response && typeof err.response === "object") {
    const response = err.response as Record<string, unknown>;
    if (typeof response.status === "number") {
      status = response.status;
    }
    // Try response.data for Circle's error payload
    if (response.data && typeof response.data === "object") {
      const data = response.data as Record<string, unknown>;
      const dataMessage = data.message || data.error;
      if (typeof dataMessage === "string") {
        return { message: sanitizeErrorMessage(dataMessage), status };
      }
      // Circle sometimes nests further: data.error.message
      if (data.error && typeof data.error === "object") {
        const nestedErr = data.error as Record<string, unknown>;
        if (typeof nestedErr.message === "string") {
          return { message: sanitizeErrorMessage(nestedErr.message), status };
        }
      }
    }
  }

  // Circle SDK may wrap errors in .error property
  if (err.error && typeof err.error === "object") {
    const nested = err.error as Record<string, unknown>;
    // NEVER access nested.config — that causes the "Cannot read properties of undefined" crash
    if (typeof nested.message === "string") {
      return { message: sanitizeErrorMessage(nested.message), status };
    }
    if (typeof nested.code === "string") {
      return { message: sanitizeErrorMessage(nested.code), status };
    }
  }

  // Standard Error .message
  if (typeof err.message === "string") {
    return { message: sanitizeErrorMessage(err.message), status };
  }

  // Error code fallback
  if (typeof err.code === "string") {
    return { message: sanitizeErrorMessage(err.code), status };
  }

  return { ...fallback, status };
}

/**
 * Remove any sensitive data that may have leaked into an error message.
 * Strips anything that looks like API keys, bearer tokens, hex secrets, or ciphertext.
 */
function sanitizeErrorMessage(msg: string): string {
  if (!msg) return "Circle API request failed";

  // Strip bearer tokens
  let sanitized = msg.replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, "[REDACTED]");
  // Strip API key patterns (long alphanumeric strings preceded by key-like context)
  sanitized = sanitized.replace(/(api[_-]?key|authorization|secret|ciphertext)[:\s=]+\S+/gi, "$1=[REDACTED]");
  // Strip long hex strings (64+ chars) that could be secrets
  sanitized = sanitized.replace(/[0-9a-f]{64,}/gi, "[REDACTED]");
  // Strip base64 blocks (100+ chars)
  sanitized = sanitized.replace(/[A-Za-z0-9+/]{100,}={0,2}/g, "[REDACTED]");

  return sanitized;
}

/**
 * Match a Circle error to a known user-friendly message.
 */
function matchCircleErrorPattern(message: string): string | null {
  for (const { pattern, message: friendly } of CIRCLE_ERROR_PATTERNS) {
    if (pattern.test(message)) {
      return friendly;
    }
  }
  return null;
}

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
  } catch (error: unknown) {
    const parsed = parseCircleError(error);
    const friendly = matchCircleErrorPattern(parsed.message);
    return { success: false, error: friendly || parsed.message || "Fee estimation failed" };
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
  } catch (error: unknown) {
    const parsed = parseCircleError(error);
    const friendly = matchCircleErrorPattern(parsed.message);

    if (friendly) {
      return { success: false, error: friendly, status: parsed.status };
    }

    // Check for blockchain-related errors specifically
    if (
      parsed.message.toLowerCase().includes("blockchain") ||
      parsed.message.toLowerCase().includes("not supported") ||
      parsed.message.toLowerCase().includes("not enabled")
    ) {
      return {
        success: false,
        error: `Circle transaction creation on ${blockchain} is not available. Please verify the blockchain is supported.`,
        status: parsed.status,
      };
    }

    return { success: false, error: parsed.message || "Circle transfer failed", status: parsed.status };
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
  } catch (error: unknown) {
    const parsed = parseCircleError(error);
    return {
      success: false,
      error: parsed.message || "Failed to get transaction status",
      status: parsed.status,
    };
  }
}
