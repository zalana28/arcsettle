import { NextResponse } from "next/server";
import { validateCircleSdkConfig } from "@/services/circle/circleSdkConfigService";

/**
 * GET /api/dev/circle/sdk/status
 *
 * Dev-only endpoint to check Circle SDK configuration status.
 * Server-side only — never returns raw API key or entity secret.
 */
export async function GET() {
  const status = validateCircleSdkConfig();

  return NextResponse.json(status, {
    status: status.configured ? 200 : 503,
  });
}
