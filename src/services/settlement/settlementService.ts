import { prisma } from "@/lib/prisma";
import { DEFAULT_CHAIN, DEFAULT_CURRENCY } from "@/lib/constants";
import { createSettlementProvider } from "./providerFactory";
import type { SettlementOrchestrationResult } from "./types";

/**
 * Settlement Service - Orchestration Layer
 *
 * Orchestrates the full settlement flow:
 * 1. Validate invoice state
 * 2. Update invoice status to processing
 * 3. Execute settlement via configured provider
 * 4. Create transaction record
 * 5. Update invoice with settlement details
 * 6. Create audit log
 *
 * The actual settlement execution is delegated to a SettlementProvider
 * (mock or arc-wallet) determined by the SETTLEMENT_PROVIDER env var.
 */
export async function settleInvoice(
  invoiceId: string,
  actorId: string
): Promise<SettlementOrchestrationResult> {
  // Get the invoice with related data
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { seller: true, buyer: true },
  });

  if (!invoice) {
    return { success: false, transactionHash: null, fee: 0, error: "Invoice not found" };
  }

  if (invoice.status !== "approved") {
    return {
      success: false,
      transactionHash: null,
      fee: 0,
      error: "Invoice must be approved before settlement",
    };
  }

  // Wallet gate: require both parties to have wallet addresses
  if (!invoice.seller.walletAddress) {
    return {
      success: false,
      transactionHash: null,
      fee: 0,
      error: "Seller wallet address is required before settlement",
    };
  }

  if (!invoice.buyer.walletAddress) {
    return {
      success: false,
      transactionHash: null,
      fee: 0,
      error: "Buyer wallet address is required before settlement",
    };
  }

  const buyerWalletAddress = invoice.buyer.walletAddress;
  const sellerWalletAddress = invoice.seller.walletAddress;

  // Step 1: Update status to processing
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: "processing" },
  });

  await createAuditLog(invoiceId, "invoice", "status_change_processing", actorId);

  try {
    // Step 2: Execute settlement via provider
    const provider = createSettlementProvider();
    const result = await provider.settleInvoice({
      invoiceId,
      sellerWalletAddress,
      buyerWalletAddress,
      amount: Number(invoice.amount),
      currency: invoice.currency || DEFAULT_CURRENCY,
      chain: DEFAULT_CHAIN,
    });

    if (result.status === "failed") {
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: "failed" },
      });
      await createAuditLog(invoiceId, "invoice", "settlement_failed", actorId, {
        provider: result.provider,
      });
      return { success: false, transactionHash: null, fee: 0, error: "Settlement failed" };
    }

    // Step 3: Create transaction record
    await prisma.transaction.create({
      data: {
        invoiceId,
        fromWallet: buyerWalletAddress,
        toWallet: sellerWalletAddress,
        amount: Number(invoice.amount),
        currency: invoice.currency || DEFAULT_CURRENCY,
        chain: DEFAULT_CHAIN,
        transactionHash: result.transactionHash,
        status: "confirmed",
        gasPaidBy: "platform",
      },
    });

    // Step 4: Update invoice with settlement details
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: "settled",
        settlementHash: result.transactionHash,
        settlementDate: result.settledAt,
        settlementFee: result.feeAmount,
      },
    });

    // Step 5: Audit log
    await createAuditLog(invoiceId, "invoice", "settled", actorId, {
      transactionHash: result.transactionHash,
      fee: result.feeAmount,
      chain: DEFAULT_CHAIN,
      provider: result.provider,
    });

    return {
      success: true,
      transactionHash: result.transactionHash,
      fee: result.feeAmount,
    };
  } catch (error) {
    // On error, mark invoice as failed
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: "failed" },
    });
    await createAuditLog(invoiceId, "invoice", "settlement_error", actorId, {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return {
      success: false,
      transactionHash: null,
      fee: 0,
      error: error instanceof Error ? error.message : "Settlement execution failed",
    };
  }
}

async function createAuditLog(
  entityId: string,
  entity: string,
  action: string,
  actor: string,
  metadata?: Record<string, unknown>
) {
  await prisma.auditLog.create({
    data: {
      entityId,
      entity,
      action,
      actor,
      metadata: metadata ? (metadata as object) : undefined,
    },
  });
}
