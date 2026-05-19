import { NextRequest, NextResponse } from "next/server";
import { createCircleTransferTransaction } from "@/services/circle/circleTransactionService";

/**
 * POST /api/dev/circle/transactions/transfer
 * Dev-only: Create a Circle transfer transaction.
 */
export async function POST(request: NextRequest) {
  const devToolsEnabled = process.env.CIRCLE_DEV_TOOLS_ENABLED === "true";
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction && !devToolsEnabled) {
    return NextResponse.json(
      { success: false, error: "Circle dev tools are disabled in production." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const result = await createCircleTransferTransaction(body);

    // Use the status from Circle error parsing if available, otherwise default
    const httpStatus = result.success ? 201 : result.status || 400;

    // Only return safe fields — never forward raw error internals
    return NextResponse.json(
      {
        success: result.success,
        data: result.data || undefined,
        error: result.error || undefined,
      },
      { status: httpStatus }
    );
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
  }
}
