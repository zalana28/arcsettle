import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createInvoiceSchema } from "@/lib/validations";
import { generateInvoiceNumber } from "@/lib/utils";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from "@/lib/api-response";

// GET /api/invoices - List invoices for current company
export async function GET() {
  const session = await getSession();
  if (!session) return unauthorizedResponse();

  const invoices = await prisma.invoice.findMany({
    where: {
      OR: [{ sellerId: session.sub }, { buyerId: session.sub }],
    },
    include: {
      seller: { select: { id: true, name: true, email: true } },
      buyer: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return successResponse(invoices);
}

// POST /api/invoices - Create a new invoice
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorizedResponse();

  try {
    const body = await request.json();
    const parsed = createInvoiceSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
    }

    const { buyerId, amount, description, dueDate } = parsed.data;

    // Verify buyer exists
    const buyer = await prisma.company.findUnique({ where: { id: buyerId } });
    if (!buyer) {
      return errorResponse("Buyer company not found", 404);
    }

    // Cannot invoice yourself
    if (buyerId === session.sub) {
      return errorResponse("Cannot create an invoice to yourself", 400);
    }

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: generateInvoiceNumber(),
        sellerId: session.sub,
        buyerId,
        amount,
        currency: "USDC",
        description,
        dueDate: new Date(dueDate),
        status: "pending_approval",
      },
      include: {
        seller: { select: { id: true, name: true, email: true } },
        buyer: { select: { id: true, name: true, email: true } },
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        entityId: invoice.id,
        entity: "invoice",
        action: "created",
        actor: session.sub,
        metadata: { invoiceNumber: invoice.invoiceNumber, amount },
      },
    });

    return successResponse(invoice, 201);
  } catch (error) {
    console.error("Create invoice error:", error);
    return errorResponse("Internal server error", 500);
  }
}
