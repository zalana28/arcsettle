import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/api-response";
import { calculateSettlementFee } from "@/lib/utils";
import { SETTLEMENT_FEE_PERCENT, DEFAULT_CHAIN } from "@/lib/constants";
import { verifySettlementTransaction } from "@/services/settlement/onchainVerificationService";
import { z } from "zod";

const recordSettlementSchema = z.object({
  transactionHash: z
    .string()
    .regex(/^0x[a-fA-F0-9]{64}$/, "Invalid transaction hash format"),
  fromWallet: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid from wallet address"),
  toWallet: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid to wallet address"),
  amount: z.number().positive("Amount must be positive"),
  chain: z.string().min(1, "Chain is required"),
});

/**
 * POST /api/invoices/:id/record-settlement
 *
 * Records a client-side wallet-signed settlement transaction.
 * Called after the frontend has confirmed an on-chain USDC transfer.
 *
 * Verification flow:
 * 1. Validate request body schema
 * 2. Validate invoice state (approved or processing)
 * 3. Validate fromWallet matches buyer.walletAddress
 * 4. Validate toWallet matches seller.walletAddress
 * 5. Check for duplicate transaction hash
 * 6. Verify transaction on-chain (receipt, Transfer event, from/to/amount)
 * 7. Only then: record transaction, update invoice, create audit log
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return unauthorizedResponse();

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = recordSettlementSchema.safeParse(body);

    if (!parsed.success) {
      const messages = parsed.error.errors.map(
        (e) => `${e.path.join(".")}: ${e.message}`
      );
      return errorResponse(`Validation failed: ${messages.join(", ")}`, 422);
    }

    const { transactionHash, fromWallet, toWallet, amount, chain } = parsed.data;

    // Get invoice
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { seller: true, buyer: true },
    });

    if (!invoice) {
      return errorResponse("Invoice not found", 404);
    }

    // Only seller or buyer can record settlement
    if (invoice.sellerId !== session.sub && invoice.buyerId !== session.sub) {
      return errorResponse("Access denied", 403);
    }

    // Invoice must be in approved or processing state
    if (invoice.status !== "approved" && invoice.status !== "processing") {
      return errorResponse(
        `Cannot record settlement for invoice with status: ${invoice.status}`,
        400
      );
    }

    // Validate fromWallet matches buyer.walletAddress
    if (
      !invoice.buyer.walletAddress ||
      fromWallet.toLowerCase() !== invoice.buyer.walletAddress.toLowerCase()
    ) {
      return errorResponse(
        "fromWallet does not match the buyer wallet address on record",
        400
      );
    }

    // Validate toWallet matches seller.walletAddress
    if (
      !invoice.seller.walletAddress ||
      toWallet.toLowerCase() !== invoice.seller.walletAddress.toLowerCase()
    ) {
      return errorResponse(
        "toWallet does not match the seller wallet address on record",
        400
      );
    }

    // Check for duplicate transaction hash
    const existingTx = await prisma.transaction.findFirst({
      where: { transactionHash },
    });
    if (existingTx) {
      return errorResponse("Transaction hash already recorded", 409);
    }

    // On-chain verification: verify transaction receipt and Transfer event
    const verification = await verifySettlementTransaction({
      transactionHash: transactionHash as `0x${string}`,
      expectedFromWallet: fromWallet,
      expectedToWallet: toWallet,
      expectedAmount: amount,
      expectedCurrency: "USDC",
      expectedChain: chain || "arc_testnet",
    });

    if (!verification.verified) {
      return errorResponse(
        `On-chain verification failed: ${verification.error}`,
        400
      );
    }

    // --- Verification passed — record settlement ---

    // Calculate settlement fee
    const settlementFee = calculateSettlementFee(amount, SETTLEMENT_FEE_PERCENT);

    // Record transaction
    await prisma.transaction.create({
      data: {
        invoiceId: id,
        fromWallet,
        toWallet,
        amount,
        currency: "USDC",
        chain: chain || DEFAULT_CHAIN,
        transactionHash,
        status: "confirmed",
        gasPaidBy: fromWallet,
      },
    });

    // Update invoice status to settled
    await prisma.invoice.update({
      where: { id },
      data: {
        status: "settled",
        settlementHash: transactionHash,
        settlementDate: new Date(),
        settlementFee: settlementFee,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityId: id,
        entity: "invoice",
        action: "settled_on_chain",
        actor: session.sub,
        metadata: {
          transactionHash,
          fromWallet,
          toWallet,
          amount,
          chain,
          fee: settlementFee,
          provider: "arc-wallet-client",
          verifiedOnChain: true,
          blockNumber: verification.details?.blockNumber?.toString(),
        } as object,
      },
    });

    return successResponse({
      invoiceId: id,
      status: "settled",
      transactionHash,
      settlementFee,
      verifiedOnChain: true,
    });
  } catch (error) {
    console.error("Record settlement error:", error);
    return errorResponse("Internal server error", 500);
  }
}
