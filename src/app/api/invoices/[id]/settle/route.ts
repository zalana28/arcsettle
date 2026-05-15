import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { settleInvoice } from "@/services/settlement";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/api-response";

// POST /api/invoices/:id/settle
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return unauthorizedResponse();

  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({ where: { id } });

  if (!invoice) {
    return errorResponse("Invoice not found", 404);
  }

  // Either seller or buyer can initiate settlement
  if (invoice.sellerId !== session.sub && invoice.buyerId !== session.sub) {
    return errorResponse("Access denied", 403);
  }

  if (invoice.status !== "approved") {
    return errorResponse(
      `Cannot settle invoice with status: ${invoice.status}`,
      400
    );
  }

  // Execute settlement
  const result = await settleInvoice(id, session.sub);

  if (!result.success) {
    return errorResponse(result.error || "Settlement failed", 500);
  }

  return successResponse({
    transactionHash: result.transactionHash,
    fee: result.fee,
    status: "settled",
  });
}
