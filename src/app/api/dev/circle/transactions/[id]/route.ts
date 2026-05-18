import { NextRequest, NextResponse } from "next/server";
import { getCircleTransactionStatus } from "@/services/circle/circleTransactionService";

/**
 * GET /api/dev/circle/transactions/:id
 * Dev-only: Get Circle transaction status.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await getCircleTransactionStatus(id);
  return NextResponse.json(result, { status: result.success ? 200 : result.status || 400 });
}
