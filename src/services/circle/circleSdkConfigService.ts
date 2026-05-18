/**
 * Circle SDK Configuration Status Service
 *
 * Validates that all required environment variables are present for
 * the Circle Developer-Controlled Wallets SDK to function.
 */

export interface CircleSdkConfigStatus {
  configured: boolean;
  hasApiKey: boolean;
  hasEntitySecret: boolean;
  message: string;
}

/**
 * Validate the Circle SDK configuration and return a structured status.
 * Never returns raw secrets.
 */
export function validateCircleSdkConfig(): CircleSdkConfigStatus {
  const hasApiKey = !!process.env.CIRCLE_API_KEY;
  const hasEntitySecret = !!process.env.CIRCLE_ENTITY_SECRET;
  const configured = hasApiKey && hasEntitySecret;

  if (configured) {
    return {
      configured: true,
      hasApiKey: true,
      hasEntitySecret: true,
      message:
        "Circle SDK is fully configured. Developer-controlled wallet operations are ready.",
    };
  }

  const missing: string[] = [];
  if (!hasApiKey) missing.push("CIRCLE_API_KEY");
  if (!hasEntitySecret) missing.push("CIRCLE_ENTITY_SECRET");

  return {
    configured: false,
    hasApiKey,
    hasEntitySecret,
    message: `Circle SDK is not fully configured. Missing: ${missing.join(", ")}`,
  };
}
