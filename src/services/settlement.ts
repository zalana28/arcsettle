import { prisma } from "@/lib/prisma";
import { generateMockTxHash, calculateSettlementFee } from "@/lib/utils";
import { SETTLEMENT_FEE_PERCENT, DEFAULT_CHAIN, DEFAULT_CURRENCY } from "@/lib/constants";

export interface SettlementResult {
  success: boolean;
  transactionHash: string | null;
  fee: number;
  error?: string;
}

export interface SettlementParams {
  invoiceId: string;
  fromWallet: string;
  toWallet: string;
  amount: number;
  currency?: string;
  chain?: string;
}

/**
 * Mock settlement implementation.
 * Replace this function with real Circle/Arc API integration later.
 */
async function executeMockSettlement(
  params: SettlementParams
): Promise<SettlementResult> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Generate mock transaction hash
  const transactionHash = generateMockTxHash();
  const fee = calculateSettlementFee(params.amount, SETTLEMENT_FEE_PERCENT);

  return {
    success: true,
    transactionHash,
    fee,
  };
}

/**
 * Main settlement service entry point.
 * Orchestrates the full settlement flow:
 * 1. Update invoice status to processing
 * 2. Execute settlement (mock for now)
 * 3. Create transaction record
 * 4. Update invoice with settlement details
 * 5. Create audit log
 */
export async function settleInvoice(
  invoiceId: string,
  actorId: string
): Promise<SettlementResult> {
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

  const fromWallet = invoice.buyer.walletAddress || `0x_buyer_${invoice.buyerId.slice(0, 8)}`;
  const toWallet = invoice.seller.walletAddress || `0x_seller_${invoice.sellerId.slice(0, 8)}`;

  // Step 1: Update status to processing
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: "processing" },
  });

  await createAuditLog(invoiceId, "invoice", "status_change_processing", actorId);

  try {
    // Step 2: Execute settlement
    const result = await executeMockSettlement({
      invoiceId,
      fromWallet,
      toWallet,
      amount: Number(invoice.amount),
      currency: invoice.currency,
      chain: DEFAULT_CHAIN,
    });

    if (!result.success) {
      // Mark as failed
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: "failed" },
      });
      await createAuditLog(invoiceId, "invoice", "settlement_failed", actorId);
      return result;
    }

    // Step 3: Create transaction record
    await prisma.transaction.create({
      data: {
        invoiceId,
        fromWallet,
        toWallet,
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
        settlementDate: new Date(),
        settlementFee: result.fee,
      },
    });

    // Step 5: Audit log
    await createAuditLog(invoiceId, "invoice", "settled", actorId, {
      transactionHash: result.transactionHash,
      fee: result.fee,
      chain: DEFAULT_CHAIN,
    });

    return result;
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
      error: "Settlement execution failed",
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
