import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/api-response";

// GET /api/invoices/:id/settlement-status
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return unauthorizedResponse();

  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!invoice) {
    return errorResponse("Invoice not found", 404);
  }

  if (invoice.sellerId !== session.sub && invoice.buyerId !== session.sub) {
    return errorResponse("Access denied", 403);
  }

  const latestTransaction = invoice.transactions[0] || null;

  return successResponse({
    invoiceId: invoice.id,
    invoiceStatus: invoice.status,
    settlementHash: invoice.settlementHash,
    settlementDate: invoice.settlementDate,
    settlementFee: invoice.settlementFee,
    transaction: latestTransaction
      ? {
          id: latestTransaction.id,
          transactionHash: latestTransaction.transactionHash,
          status: latestTransaction.status,
          chain: latestTransaction.chain,
          fromWallet: latestTransaction.fromWallet,
          toWallet: latestTransaction.toWallet,
          amount: latestTransaction.amount,
          currency: latestTransaction.currency,
        }
      : null,
  });
}
