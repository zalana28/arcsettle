/**
 * Circle API Key Verification Service
 *
 * Verifies that the configured Circle API key is valid for Wallets/Web3 Services
 * by trying known Circle Wallets endpoints. Returns a structured result without
 * ever exposing the raw API key.
 */

import { circleRequest, isCircleConfigured } from "./circleClient";

export interface CircleVerificationResult {
  ok: boolean;
  configured: boolean;
  endpoint?: string;
  status?: number;
  message: string;
}

/**
 * Endpoints to try for verifying Circle Wallets API key validity.
 * Ordered from most specific (authenticated Wallets endpoints) to
 * least specific (connectivity check).
 */
const VERIFICATION_ENDPOINTS = [
  { path: "/v1/w3s/config/entity/publicKey", label: "EntityPublicKey" },
  { path: "/v1/w3s/wallets", label: "WalletsList" },
  { path: "/ping", label: "Ping" },
];

/**
 * Verify the Circle API key by attempting requests to Wallets/Web3 endpoints.
 *
 * Logic:
 * - If CIRCLE_API_KEY is not set, return configured: false immediately
 * - Try each endpoint sequentially (do not stop on 403/404)
 * - If any authenticated Wallets endpoint (EntityPublicKey or WalletsList) returns 200,
 *   the key is valid → return ok: true
 * - If only /ping returns 200 but Wallets endpoints failed,
 *   return ok: false, configured: true (API reachable but key lacks Wallets access)
 * - Never return the raw API key
 */
export async function verifyCircleApiKey(): Promise<CircleVerificationResult> {
  if (!isCircleConfigured()) {
    return {
      ok: false,
      configured: false,
      message: "CIRCLE_API_KEY is not configured in environment variables",
    };
  }

  const results: { endpoint: string; status: number }[] = [];
  let pingOk = false;

  for (const ep of VERIFICATION_ENDPOINTS) {
    try {
      const res = await circleRequest(ep.path, { method: "GET" });
      results.push({ endpoint: ep.label, status: res.status });

      if (res.status >= 200 && res.status < 300) {
        // Authenticated Wallets endpoint success → key is valid
        if (ep.label !== "Ping") {
          return {
            ok: true,
            configured: true,
            endpoint: ep.label,
            status: res.status,
            message: `Circle Wallets API key verified via ${ep.label} endpoint`,
          };
        }
        // Ping success — note it but continue (it's unauthenticated)
        pingOk = true;
      }
    } catch {
      // Network error — record and continue
      results.push({ endpoint: ep.label, status: 0 });
    }
  }

  // If ping succeeded but no Wallets endpoint returned 200
  if (pingOk) {
    return {
      ok: false,
      configured: true,
      endpoint: "Ping",
      status: 200,
      message:
        "Circle API reachable, but Wallets API key verification failed.",
    };
  }

  // No endpoint returned success at all
  const lastResult = results[results.length - 1];
  return {
    ok: false,
    configured: true,
    endpoint: lastResult?.endpoint,
    status: lastResult?.status,
    message: `Could not verify Circle Wallets API key. Tried ${results.length} endpoints, none returned success.`,
  };
}
