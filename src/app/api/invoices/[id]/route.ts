import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/api-response";

// GET /api/invoices/:id
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
      seller: { select: { id: true, name: true, email: true, walletAddress: true } },
      buyer: { select: { id: true, name: true, email: true, walletAddress: true } },
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!invoice) {
    return errorResponse("Invoice not found", 404);
  }

  // Only seller or buyer can view
  if (invoice.sellerId !== session.sub && invoice.buyerId !== session.sub) {
    return errorResponse("Access denied", 403);
  }

  return successResponse(invoice);
}
