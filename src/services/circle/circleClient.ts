/**
 * Circle API Client — Server-Side Only
 *
 * Provides a safe server-side helper for interacting with the Circle API.
 * The API key is read from process.env and NEVER exposed to the frontend.
 *
 * IMPORTANT: This module must only be imported in server-side code
 * (API routes, server components, services). Never import in "use client" files.
 */

export interface CircleClientConfig {
  apiKey: string;
  baseUrl: string;
}

function getCircleConfig(): CircleClientConfig {
  const apiKey = process.env.CIRCLE_API_KEY;
  const baseUrl = process.env.CIRCLE_API_BASE_URL || "https://api.circle.com";

  if (!apiKey) {
    throw new Error(
      "CIRCLE_API_KEY is not configured. Add it to your .env file. " +
        "This key must remain server-side only."
    );
  }

  return { apiKey, baseUrl };
}

/**
 * Make an authenticated request to the Circle API.
 */
export async function circleRequest(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const config = getCircleConfig();

  const url = `${config.baseUrl}${path}`;

  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
      ...options.headers,
    },
  });
}

/**
 * Check if the Circle API key is configured (without throwing).
 */
export function isCircleConfigured(): boolean {
  return !!process.env.CIRCLE_API_KEY;
}
