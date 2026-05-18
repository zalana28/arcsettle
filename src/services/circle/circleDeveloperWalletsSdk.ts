/**
 * Circle Developer-Controlled Wallets SDK Client — Server-Side Only
 *
 * Uses the official @circle-fin/developer-controlled-wallets SDK to manage
 * developer-controlled wallets. The SDK handles entity secret ciphertext
 * generation automatically for each sensitive request.
 *
 * IMPORTANT:
 * - This module must only be imported in server-side code
 * - CIRCLE_API_KEY and CIRCLE_ENTITY_SECRET must never be exposed to frontend
 * - The SDK generates fresh ciphertext per request (single-use requirement)
 */

import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";

let clientInstance: ReturnType<typeof initiateDeveloperControlledWalletsClient> | null = null;

/**
 * Get or create the Circle Developer-Controlled Wallets SDK client.
 *
 * Throws if CIRCLE_API_KEY or CIRCLE_ENTITY_SECRET is not configured.
 */
export function getCircleDeveloperWalletsClient() {
  if (clientInstance) return clientInstance;

  const apiKey = process.env.CIRCLE_API_KEY;
  const entitySecret = process.env.CIRCLE_ENTITY_SECRET;

  if (!apiKey) {
    throw new Error(
      "CIRCLE_API_KEY is not configured. " +
        "Add it to your .env file. This key must remain server-side only."
    );
  }

  if (!entitySecret) {
    throw new Error(
      "CIRCLE_ENTITY_SECRET is not configured. " +
        "Add it to your .env file. This secret must remain server-side only. " +
        "The SDK uses it to generate fresh ciphertext for each request."
    );
  }

  clientInstance = initiateDeveloperControlledWalletsClient({
    apiKey,
    entitySecret,
  });

  return clientInstance;
}

/**
 * Check if the SDK can be initialized (both required env vars present).
 * Does not actually create the client.
 */
export function isCircleSdkConfigured(): boolean {
  return !!process.env.CIRCLE_API_KEY && !!process.env.CIRCLE_ENTITY_SECRET;
}
