import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createCircleTransferTransaction } from "@/services/circle/circleTransactionService";
import { randomUUID } from "crypto";

const isDev = process.env.NODE_ENV === "development";

/**
 * POST /api/dev/invoices/:id/circle-transfer
 *
 * Dev-only: Execute a Circle transfer for an invoice.
 * Does NOT mark invoice as settled — settlement confirmation is handled later.
 *
 * IMPORTANT: Transaction row and invoice status are ONLY updated after
 * Circle transaction creation succeeds. If Circle fails, nothing is persisted.
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
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { seller: true, buyer: true },
    });

    if (!invoice) {
      return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
    }

    if (invoice.status !== "approved") {
      return NextResponse.json(
        { success: false, error: `Invoice must be approved. Current: ${invoice.status}` },
        { status: 400 }
      );
    }

    if (!invoice.buyer.circleWalletId) {
      return NextResponse.json(
        { success: false, error: "Buyer does not have a Circle wallet" },
        { status: 400 }
      );
    }

    const destinationAddress = invoice.seller.circleWalletAddress || invoice.seller.walletAddress;
    if (!destinationAddress) {
      return NextResponse.json(
        { success: false, error: "Seller has no destination wallet address" },
        { status: 400 }
      );
    }

    // Self-settlement guard
    const sourceAddress = invoice.buyer.circleWalletAddress || invoice.buyer.walletAddress;
    if (
      sourceAddress &&
      destinationAddress &&
      sourceAddress.toLowerCase() === destinationAddress.toLowerCase()
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid settlement: payer and receiver wallets must be different." },
        { status: 400 }
      );
    }

    // ─── Step 1: Create Circle transfer ─────────────────────────────────────
    // If this fails, we do NOT create a Transaction row or change invoice status.
    const transferInput = {
      sourceWalletId: invoice.buyer.circleWalletId,
      destinationAddress,
      amount: invoice.amount.toString(),
      blockchain: "ARC-TESTNET",
      currency: "USDC",
      idempotencyKey: randomUUID(),
    };

    if (isDev) {
      console.log("[circle-transfer:start]", {
        invoiceId: id,
        walletId: transferInput.sourceWalletId,
        destinationAddress: transferInput.destinationAddress,
        amount: transferInput.amount,
        blockchain: transferInput.blockchain,
        currency: transferInput.currency,
        hasTokenId: false,
      });
    }

    const result = await createCircleTransferTransaction(transferInput);

    if (!result.success || !result.data) {
      if (isDev) {
        console.error("[circle-transfer:sdk-error]", {
          invoiceId: id,
          errorMessage: result.error,
          status: result.status,
        });
      }
      return NextResponse.json(
        { success: false, error: result.error || "Circle transfer failed" },
        { status: result.status || 400 }
      );
    }

    if (isDev) {
      console.log("[circle-transfer:payload-summary]", {
        invoiceId: id,
        circleTransactionId: result.data.transactionId,
        state: result.data.state,
        blockchain: result.data.blockchain,
      });
    }

    // ─── Step 2: Record transaction ONLY after Circle succeeds ──────────────
    await prisma.transaction.create({
      data: {
        invoiceId: id,
        fromWallet: invoice.buyer.circleWalletAddress || invoice.buyer.circleWalletId,
        toWallet: destinationAddress,
        amount: Number(invoice.amount),
        currency: "USDC",
        chain: "arc_testnet",
        status: "pending",
        circleTransactionId: result.data.transactionId,
        circleTransactionStatus: result.data.state,
        circleTransactionType: result.data.transactionType || "TRANSFER",
        circleWalletId: invoice.buyer.circleWalletId,
        circleSourceAddress: result.data.sourceAddress || null,
        circleDestinationAddress: destinationAddress,
      },
    });

    // ─── Step 3: Update invoice to processing (NOT settled) ─────────────────
    await prisma.invoice.update({
      where: { id },
      data: { status: "processing" },
    });

    // ─── Step 4: Audit log ──────────────────────────────────────────────────
    await prisma.auditLog.create({
      data: {
        entityId: id,
        entity: "invoice",
        action: "circle_transfer_created",
        actor: "dev-tools",
        metadata: {
          circleTransactionId: result.data.transactionId,
          state: result.data.state,
          destinationAddress,
          amount: invoice.amount.toString(),
          blockchain: "ARC-TESTNET",
        } as object,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          invoiceId: id,
          invoiceStatus: "processing",
          circleTransaction: result.data,
          note: "Invoice moved to processing. Settlement will be confirmed via webhook/polling in a later phase.",
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    // Catch unexpected errors (DB failures, unhandled exceptions) without leaking internals
    const safeMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";

    // Dev-only: log safe error details (never secrets, auth headers, or config)
    if (isDev) {
      console.error("[circle-transfer:sdk-error]", {
        invoiceId: id,
        errorMessage: safeMessage,
      });
    }

    return NextResponse.json(
      { success: false, error: "An unexpected error occurred during the transfer" },
      { status: 500 }
    );
  }
}
