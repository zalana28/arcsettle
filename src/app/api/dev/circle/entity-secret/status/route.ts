import { NextResponse } from "next/server";
import {
  validateEntitySecretConfig,
  getMaskedCiphertext,
} from "@/services/circle/entitySecretService";

/**
 * GET /api/dev/circle/entity-secret/status
 *
 * Dev-only endpoint to check entity secret configuration status.
 * Server-side only — never returns raw secret or full ciphertext.
 */
export async function GET() {
  const status = validateEntitySecretConfig();
  const maskedCiphertext = getMaskedCiphertext();

  return NextResponse.json({
    ...status,
    ciphertextPreview: maskedCiphertext,
  });
}
