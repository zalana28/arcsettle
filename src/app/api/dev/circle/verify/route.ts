import { NextResponse } from "next/server";
import { verifyCircleApiKey } from "@/services/circle/circleVerificationService";

/**
 * GET /api/dev/circle/verify
 *
 * Dev-only endpoint to verify Circle API key configuration.
 * Server-side only — never returns the raw API key.
 *
 * Response:
 * {
 *   ok: boolean,
 *   configured: boolean,
 *   endpoint?: string,
 *   status?: number,
 *   message: string
 * }
 */
export async function GET() {
  const result = await verifyCircleApiKey();

  return NextResponse.json(result, {
    status: result.ok ? 200 : result.configured ? 401 : 503,
  });
}
