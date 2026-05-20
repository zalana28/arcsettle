import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/dev/invoices/:id/circle-transfer-preview
 *
 * Returns a prepared transfer preview without executing payment.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { seller: true, buyer: true },
  });

  if (!invoice) {
    return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
  }

  if (invoice.status !== "approved" && invoice.status !== "processing") {
    return NextResponse.json(
      { success: false, error: `Invoice must be approved or processing. Current: ${invoice.status}` },
      { status: 400 }
    );
  }

  if (!invoice.buyer.circleWalletId) {
    return NextResponse.json(
      { success: false, error: "Buyer does not have a Circle wallet. Create one first via /api/dev/companies/:id/circle-wallet" },
      { status: 400 }
    );
  }

  // Determine destination: prefer seller.circleWalletAddress, fallback to seller.walletAddress
  const destinationAddress = invoice.seller.circleWalletAddress || invoice.seller.walletAddress;
  if (!destinationAddress) {
    return NextResponse.json(
      { success: false, error: "Seller has no wallet address (neither Circle nor external)" },
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

  return NextResponse.json({
    success: true,
    data: {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      sourceWalletId: invoice.buyer.circleWalletId,
      sourceAddress: invoice.buyer.circleWalletAddress || undefined,
      destinationAddress,
      amount: invoice.amount.toString(),
      currency: invoice.currency || "USDC",
      blockchain: "ARC-TESTNET",
      buyerName: invoice.buyer.name,
      sellerName: invoice.seller.name,
    },
  });
}
