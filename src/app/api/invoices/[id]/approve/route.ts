import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/api-response";

// POST /api/invoices/:id/approve
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

  // Only buyer can approve
  if (invoice.buyerId !== session.sub) {
    return errorResponse("Only the buyer can approve this invoice", 403);
  }

  if (invoice.status !== "pending_approval") {
    return errorResponse(
      `Cannot approve invoice with status: ${invoice.status}`,
      400
    );
  }

  // Mock compliance check
  const complianceCheck = true; // Replace with real compliance check later
  if (!complianceCheck) {
    return errorResponse("Compliance check failed", 400);
  }

  const updated = await prisma.invoice.update({
    where: { id },
    data: {
      status: "approved",
      approvedAt: new Date(),
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      entityId: id,
      entity: "invoice",
      action: "approved",
      actor: session.sub,
    },
  });

  return successResponse(updated);
}
