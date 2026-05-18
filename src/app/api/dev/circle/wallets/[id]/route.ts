import { NextRequest, NextResponse } from "next/server";
import { getWallet } from "@/services/circle/circleWalletService";
import { isCircleConfigured } from "@/services/circle/circleClient";

/**
 * GET /api/dev/circle/wallets/:id
 *
 * Dev-only endpoint to get a specific Circle wallet by ID.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isCircleConfigured()) {
    return NextResponse.json(
      { success: false, error: "CIRCLE_API_KEY is not configured" },
      { status: 503 }
    );
  }

  const { id } = await params;
  const result = await getWallet(id);

  return NextResponse.json(result, {
    status: result.success ? 200 : result.status || 500,
  });
}
