import { NextRequest, NextResponse } from "next/server";
import { listWallets, createWallet } from "@/services/circle/circleWalletService";
import { isCircleConfigured } from "@/services/circle/circleClient";

/**
 * GET /api/dev/circle/wallets
 *
 * Dev-only endpoint to list Circle wallets.
 * Returns wallet data from Circle Programmable Wallets API.
 */
export async function GET() {
  if (!isCircleConfigured()) {
    return NextResponse.json(
      { success: false, error: "CIRCLE_API_KEY is not configured" },
      { status: 503 }
    );
  }

  const result = await listWallets();

  return NextResponse.json(result, {
    status: result.success ? 200 : result.status || 500,
  });
}

/**
 * POST /api/dev/circle/wallets
 *
 * Dev-only endpoint to create a Circle wallet.
 * Protected: only allowed when NODE_ENV !== "production" or CIRCLE_DEV_TOOLS_ENABLED=true.
 */
export async function POST(request: NextRequest) {
  const devToolsEnabled = process.env.CIRCLE_DEV_TOOLS_ENABLED === "true";
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction && !devToolsEnabled) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Circle dev tools are disabled in production. Set CIRCLE_DEV_TOOLS_ENABLED=true to enable.",
      },
      { status: 403 }
    );
  }

  if (!isCircleConfigured()) {
    return NextResponse.json(
      { success: false, error: "CIRCLE_API_KEY is not configured" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();

    if (!body.idempotencyKey) {
      return NextResponse.json(
        { success: false, error: "idempotencyKey is required" },
        { status: 422 }
      );
    }

    const result = await createWallet(body);

    return NextResponse.json(result, {
      status: result.success ? 201 : result.status || 500,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }
}
