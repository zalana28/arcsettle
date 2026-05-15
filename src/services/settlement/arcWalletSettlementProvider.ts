import {
  ARC_TESTNET_USDC_ADDRESS,
  ARC_TESTNET_USDC_DECIMALS,
  isArcUsdcConfigured,
} from "@/lib/arc";
import type { SettlementProvider, SettlementInput, SettlementResult } from "./types";

/**
 * Arc Wallet Settlement Provider
 *
 * This provider will execute real USDC transfers on Arc Testnet (chain id: 5042002)
 * using a connected wallet to sign an ERC-20 transfer transaction.
 *
 * Current status: VALIDATION ONLY — real signing is not yet implemented.
 *
 * Future implementation flow (Phase 4):
 * 1. Buyer's connected wallet signs an ERC-20 transfer tx
 * 2. Transfer USDC from buyer wallet → seller wallet on Arc Testnet
 * 3. Wait for transaction receipt (1-2 block confirmations)
 * 4. Return real transaction hash and settlement metadata
 *
 * Prerequisites for activation:
 * - Official USDC contract deployed on Arc Testnet
 * - ARC_TESTNET_USDC_ADDRESS configured in src/lib/arc.ts
 * - SETTLEMENT_PROVIDER=arc-wallet in .env
 * - Client-side wallet signing integration
 */
export class ArcWalletSettlementProvider implements SettlementProvider {
  readonly name = "arc-wallet";

  async settleInvoice(input: SettlementInput): Promise<SettlementResult> {
    // --- Input Validation ---

    // Validate seller wallet address
    if (!input.sellerWalletAddress || !input.sellerWalletAddress.startsWith("0x")) {
      throw new ArcSettlementError(
        "Invalid seller wallet address. A valid 0x Ethereum address is required.",
        "INVALID_SELLER_WALLET"
      );
    }

    // Validate buyer wallet address
    if (!input.buyerWalletAddress || !input.buyerWalletAddress.startsWith("0x")) {
      throw new ArcSettlementError(
        "Invalid buyer wallet address. A valid 0x Ethereum address is required.",
        "INVALID_BUYER_WALLET"
      );
    }

    // Validate amount
    if (input.amount <= 0) {
      throw new ArcSettlementError(
        "Settlement amount must be greater than zero.",
        "INVALID_AMOUNT"
      );
    }

    // Validate currency is USDC
    if (input.currency !== "USDC") {
      throw new ArcSettlementError(
        `Unsupported currency: ${input.currency}. Only USDC is supported on Arc Testnet.`,
        "UNSUPPORTED_CURRENCY"
      );
    }

    // Validate chain is arc_testnet
    if (input.chain !== "arc_testnet") {
      throw new ArcSettlementError(
        `Unsupported chain: ${input.chain}. Only arc_testnet is supported.`,
        "UNSUPPORTED_CHAIN"
      );
    }

    // Validate USDC token address is configured
    if (!isArcUsdcConfigured()) {
      throw new ArcSettlementError(
        "Arc Testnet USDC token address is not configured. " +
          "Set ARC_TESTNET_USDC_ADDRESS in src/lib/arc.ts once the official token is deployed.",
        "USDC_NOT_CONFIGURED"
      );
    }

    // --- Future Implementation ---
    // At this point, all validations pass. The following steps will be
    // implemented once client-side wallet signing is integrated:

    // TODO: Step 1 — Convert amount to USDC smallest unit
    //   const amountInSmallestUnit = parseUnits(input.amount.toString(), ARC_TESTNET_USDC_DECIMALS);

    // TODO: Step 2 — Check buyer USDC balance via publicClient.readContract
    //   const balance = await publicClient.readContract({
    //     address: ARC_TESTNET_USDC_ADDRESS,
    //     abi: ERC20_ABI,
    //     functionName: "balanceOf",
    //     args: [input.buyerWalletAddress],
    //   });
    //   if (balance < amountInSmallestUnit) throw insufficient funds error

    // TODO: Step 3 — Buyer wallet signs ERC-20 transfer transaction
    //   const txHash = await walletClient.writeContract({
    //     address: ARC_TESTNET_USDC_ADDRESS,
    //     abi: ERC20_ABI,
    //     functionName: "transfer",
    //     args: [input.sellerWalletAddress, amountInSmallestUnit],
    //   });

    // TODO: Step 4 — Wait for transaction receipt
    //   const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    // TODO: Step 5 — Return settlement result with real tx hash
    //   return {
    //     transactionHash: txHash,
    //     status: "confirmed",
    //     settledAt: new Date(),
    //     provider: this.name,
    //     feeAmount: calculateSettlementFee(input.amount, SETTLEMENT_FEE_PERCENT),
    //   };

    // For now: throw clear error indicating this provider is not yet active
    throw new ArcSettlementError(
      `Real Arc Testnet USDC settlement is not yet active. ` +
        `All validations passed (seller: ${input.sellerWalletAddress.slice(0, 10)}..., ` +
        `buyer: ${input.buyerWalletAddress.slice(0, 10)}..., ` +
        `amount: ${input.amount} USDC, decimals: ${ARC_TESTNET_USDC_DECIMALS}, ` +
        `token: ${ARC_TESTNET_USDC_ADDRESS}). ` +
        `Set SETTLEMENT_PROVIDER=mock to use mock settlement.`,
      "NOT_ACTIVE"
    );
  }
}

/**
 * Typed error class for Arc settlement failures.
 * Includes an error code for programmatic handling.
 */
export class ArcSettlementError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(`Arc Wallet Settlement: ${message}`);
    this.name = "ArcSettlementError";
    this.code = code;
  }
}
