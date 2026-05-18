/**
 * Circle Wallets Service — Server-Side Only
 *
 * Provides server-side helpers for managing Circle developer-controlled wallets.
 * Uses the Circle Programmable Wallets API (W3S).
 *
 * IMPORTANT: This module must only be imported in server-side code.
 * Circle API key is never exposed to the frontend.
 */

import { circleRequest } from "./circleClient";
import type {
  CircleWallet,
  CircleWalletCreateInput,
  CircleWalletServiceResult,
} from "./types";

/**
 * List all wallets in the entity's wallet set.
 */
export async function listWallets(): Promise<CircleWalletServiceResult<CircleWallet[]>> {
  try {
    const res = await circleRequest("/v1/w3s/wallets", { method: "GET" });

    if (!res.ok) {
      const body = await res.text();
      return {
        success: false,
        error: `Circle API returned ${res.status}: ${body}`,
        status: res.status,
      };
    }

    const json = await res.json();
    const wallets: CircleWallet[] = json.data?.wallets || [];

    return { success: true, data: wallets };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to list wallets",
    };
  }
}

/**
 * Get a specific wallet by ID.
 */
export async function getWallet(
  walletId: string
): Promise<CircleWalletServiceResult<CircleWallet>> {
  try {
    const res = await circleRequest(`/v1/w3s/wallets/${walletId}`, {
      method: "GET",
    });

    if (!res.ok) {
      const body = await res.text();
      return {
        success: false,
        error: `Circle API returned ${res.status}: ${body}`,
        status: res.status,
      };
    }

    const json = await res.json();
    const wallet: CircleWallet = json.data?.wallet;

    if (!wallet) {
      return { success: false, error: "Wallet not found in response", status: 404 };
    }

    return { success: true, data: wallet };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get wallet",
    };
  }
}

/**
 * Create a new developer-controlled wallet.
 *
 * Requires a valid walletSetId. If not provided, uses the entity's default.
 */
export async function createWallet(
  input: CircleWalletCreateInput
): Promise<CircleWalletServiceResult<CircleWallet[]>> {
  try {
    const res = await circleRequest("/v1/w3s/developer/wallets", {
      method: "POST",
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      const body = await res.text();
      return {
        success: false,
        error: `Circle API returned ${res.status}: ${body}`,
        status: res.status,
      };
    }

    const json = await res.json();
    const wallets: CircleWallet[] = json.data?.wallets || [];

    return { success: true, data: wallets };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create wallet",
    };
  }
}
