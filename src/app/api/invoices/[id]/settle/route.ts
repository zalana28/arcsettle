import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { settleInvoice } from "@/services/settlement";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/api-response";

/**
 * Checks whether mock settlement is allowed.
 *
 * Rules:
 * - SETTLEMENT_PROVIDER must be "mock"
 * - In production (NODE_ENV=production), ENABLE_MOCK_SETTLEMENT must be explicitly "true"
 * - In non-production, mock settlement is allowed by default unless explicitly disabled
 */
function isMockSettlementAllowed(): boolean {
  const provider = process.env.SETTLEMENT_PROVIDER || "mock";
  if (provider !== "mock") return false;

  const isProduction = process.env.NODE_ENV === "production";
  const mockEnabled = process.env.ENABLE_MOCK_SETTLEMENT;

  if (isProduction) {
    // In production, mock settlement must be explicitly enabled
    return mockEnabled === "true";
  }

  // In development/test, allow mock unless explicitly disabled
  return mockEnabled !== "false";
}

// POST /api/invoices/:id/settle
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return unauthorizedResponse();

  const { id } = await params;

  // Settlement mode safety check
  if (!isMockSettlementAllowed()) {
    return errorResponse(
      "Mock settlement is not enabled. Use wallet settlement with transaction proof, or enable mock settlement for demo mode.",
      403
    );
  }

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
    provider: "mock",
  });
}
