/**
 * Circle API Key Verification Service
 *
 * Verifies that the configured Circle API key is valid by trying
 * known Circle API endpoints. Returns a structured result without
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
 * Endpoints to try for verifying Circle API key validity.
 * We try multiple endpoints because different API key scopes
 * may have access to different resources.
 */
const VERIFICATION_ENDPOINTS = [
  { path: "/v1/configuration", label: "Configuration" },
  { path: "/v1/businessAccount/balances", label: "Business Balances" },
  { path: "/v2/wallets", label: "Wallets" },
];

/**
 * Verify the Circle API key by attempting requests to known endpoints.
 *
 * Logic:
 * - If CIRCLE_API_KEY is not set, return configured: false immediately
 * - Try each endpoint sequentially
 * - A 2xx response means the key is valid for that endpoint
 * - A 401/403 means the key is invalid or lacks permissions
 * - A 404 may mean the endpoint doesn't apply to this key type
 * - Continue trying all endpoints before concluding
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

  for (const ep of VERIFICATION_ENDPOINTS) {
    try {
      const res = await circleRequest(ep.path, { method: "GET" });

      results.push({ endpoint: ep.label, status: res.status });

      if (res.status >= 200 && res.status < 300) {
        return {
          ok: true,
          configured: true,
          endpoint: ep.label,
          status: res.status,
          message: `Circle API key verified via ${ep.label} endpoint`,
        };
      }
    } catch {
      // Network error — record and continue
      results.push({
        endpoint: ep.label,
        status: 0,
      });
    }
  }

  // Check if any endpoint returned 401/403 (invalid key)
  const authFailure = results.find(
    (r) => r.status === 401 || r.status === 403
  );

  if (authFailure) {
    return {
      ok: false,
      configured: true,
      endpoint: authFailure.endpoint,
      status: authFailure.status,
      message: `Circle API key is invalid or lacks permissions (${authFailure.status} from ${authFailure.endpoint})`,
    };
  }

  // All endpoints returned non-success (404, 500, network errors)
  const lastResult = results[results.length - 1];
  return {
    ok: false,
    configured: true,
    endpoint: lastResult?.endpoint,
    status: lastResult?.status,
    message: `Could not verify Circle API key. Tried ${results.length} endpoints, none returned success.`,
  };
}
