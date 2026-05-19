import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncCircleTransactionStatus } from "@/services/circle/circleTransactionService";

/**
 * POST /api/dev/invoices/:id/check-circle-status
 *
 * Dev/admin endpoint: Check the Circle transaction status for an invoice
 * and update the invoice/transaction state accordingly.
 *
 * Circle state mapping:
 * - SUCCESS states (COMPLETE, CONFIRMED, etc.) → invoice settled, transaction completed
 * - FAILURE states (FAILED, CANCELLED, etc.) → transaction failed, invoice stays processing
 * - PENDING states (INITIATED, PENDING, etc.) → no change, return current status
 * - UNKNOWN states → no change, return current status
 *
 * Safety:
 * - If Circle status fetch fails, no DB changes are made
 * - Never exposes API key, entity secret, ciphertext, or raw config
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const devToolsEnabled = process.env.CIRCLE_DEV_TOOLS_ENABLED === "true";
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction && !devToolsEnabled) {
    return NextResponse.json(
      { success: false, error: "Circle dev tools are disabled in production." },
      { status: 403 }
    );
  }

  const { id } = await params;

  try {
    // ─── Load invoice ─────────────────────────────────────────────────────────
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { transactions: true },
    });

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: "Invoice not found" },
        { status: 404 }
      );
    }

    // If already settled, return current status safely
    if (invoice.status === "settled") {
      return NextResponse.json({
        success: true,
        data: {
          invoiceId: id,
          invoiceStatus: "settled",
          settlementDate: invoice.settlementDate,
          settlementHash: invoice.settlementHash,
          note: "Invoice is already settled.",
        },
      });
    }

    // Only check status for invoices in processing state
    if (invoice.status !== "processing") {
      return NextResponse.json(
        {
          success: false,
          error: `Invoice must be in processing state to check Circle status. Current: ${invoice.status}`,
        },
        { status: 400 }
      );
    }

    // ─── Find latest transaction with circleTransactionId ─────────────────────
    const circleTransaction = invoice.transactions
      .filter((t) => t.circleTransactionId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

    if (!circleTransaction || !circleTransaction.circleTransactionId) {
      return NextResponse.json(
        { success: false, error: "No Circle transaction found for this invoice" },
        { status: 404 }
      );
    }

    // ─── Fetch Circle status ──────────────────────────────────────────────────
    const syncResult = await syncCircleTransactionStatus({
      invoiceId: id,
      transactionId: circleTransaction.id,
      circleTransactionId: circleTransaction.circleTransactionId,
    });

    if (!syncResult.success) {
      // Circle status fetch failed — do NOT change anything
      return NextResponse.json(
        {
          success: false,
          error: syncResult.error || "Failed to fetch Circle transaction status",
        },
        { status: 502 }
      );
    }

    const { circleState, stateCategory, txHash } = syncResult;

    // ─── Handle SUCCESS states ────────────────────────────────────────────────
    if (stateCategory === "success") {
      // Update transaction to completed
      await prisma.transaction.update({
        where: { id: circleTransaction.id },
        data: {
          status: "confirmed",
          circleTransactionStatus: circleState,
          ...(txHash ? { transactionHash: txHash } : {}),
        },
      });

      // Update invoice to settled
      await prisma.invoice.update({
        where: { id },
        data: {
          status: "settled",
          settlementDate: new Date(),
          ...(txHash ? { settlementHash: txHash } : {}),
        },
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          entityId: id,
          entity: "invoice",
          action: "circle_transfer_confirmed",
          actor: "dev-tools",
          metadata: {
            circleTransactionId: circleTransaction.circleTransactionId,
            circleState,
            txHash: txHash || null,
            transactionId: circleTransaction.id,
          } as object,
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          invoiceId: id,
          invoiceStatus: "settled",
          circleState,
          stateCategory,
          txHash: txHash || null,
          settlementDate: new Date().toISOString(),
          note: "Circle transfer confirmed. Invoice marked as settled.",
        },
      });
    }

    // ─── Handle FAILURE states ────────────────────────────────────────────────
    if (stateCategory === "failure") {
      // Update transaction to failed
      await prisma.transaction.update({
        where: { id: circleTransaction.id },
        data: {
          status: "failed",
          circleTransactionStatus: circleState,
        },
      });

      // Return invoice to approved (so it can be retried)
      await prisma.invoice.update({
        where: { id },
        data: { status: "approved" },
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          entityId: id,
          entity: "invoice",
          action: "circle_transfer_failed",
          actor: "dev-tools",
          metadata: {
            circleTransactionId: circleTransaction.circleTransactionId,
            circleState,
            transactionId: circleTransaction.id,
          } as object,
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          invoiceId: id,
          invoiceStatus: "approved",
          circleState,
          stateCategory,
          note: "Circle transfer failed. Invoice returned to approved for retry.",
        },
      });
    }

    // ─── Handle PENDING / UNKNOWN states ──────────────────────────────────────
    // Update circleTransactionStatus but do NOT change invoice status
    if (circleState && circleState !== circleTransaction.circleTransactionStatus) {
      await prisma.transaction.update({
        where: { id: circleTransaction.id },
        data: { circleTransactionStatus: circleState },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        invoiceId: id,
        invoiceStatus: "processing",
        circleState,
        stateCategory,
        txHash: txHash || null,
        note: "Circle transaction is not final yet. Invoice remains in processing.",
      },
    });
  } catch (error: unknown) {
    const safeMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    console.error("[check-circle-status] Unexpected error for invoice:", id, safeMessage);

    return NextResponse.json(
      { success: false, error: "An unexpected error occurred while checking Circle status" },
      { status: 500 }
    );
  }
}
