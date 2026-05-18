/**
 * Circle Entity Secret Service — Server-Side Only
 *
 * Manages Circle entity secret / ciphertext configuration for
 * developer-controlled wallet operations.
 *
 * IMPORTANT:
 * - CIRCLE_ENTITY_SECRET must NEVER be exposed via API routes or frontend
 * - CIRCLE_ENTITY_SECRET_CIPHERTEXT is the encrypted form used in API calls
 * - Production should use secure secret management (e.g., Vercel env, AWS Secrets Manager)
 */

export interface EntitySecretConfigStatus {
  configured: boolean;
  hasRawSecret: boolean;
  hasCiphertext: boolean;
  message: string;
}

/**
 * Check if the entity secret ciphertext is configured.
 */
export function isEntitySecretConfigured(): boolean {
  return !!process.env.CIRCLE_ENTITY_SECRET_CIPHERTEXT;
}

/**
 * Get the entity secret ciphertext for use in Circle API calls.
 * Throws if not configured.
 */
export function getEntitySecretCiphertext(): string {
  const ciphertext = process.env.CIRCLE_ENTITY_SECRET_CIPHERTEXT;

  if (!ciphertext) {
    throw new Error(
      "CIRCLE_ENTITY_SECRET_CIPHERTEXT is not configured. " +
        "Generate it using Circle's documented flow and store it in environment variables."
    );
  }

  return ciphertext;
}

/**
 * Validate the entity secret configuration and return a structured status.
 * Never returns the raw secret or full ciphertext.
 */
export function validateEntitySecretConfig(): EntitySecretConfigStatus {
  const hasRawSecret = !!process.env.CIRCLE_ENTITY_SECRET;
  const hasCiphertext = !!process.env.CIRCLE_ENTITY_SECRET_CIPHERTEXT;

  if (hasCiphertext) {
    return {
      configured: true,
      hasRawSecret,
      hasCiphertext: true,
      message: "Entity secret ciphertext is configured and ready for wallet operations.",
    };
  }

  if (hasRawSecret && !hasCiphertext) {
    return {
      configured: false,
      hasRawSecret: true,
      hasCiphertext: false,
      message:
        "Raw entity secret is set but ciphertext is missing. " +
        "Generate the ciphertext using Circle's encryption flow and store it in CIRCLE_ENTITY_SECRET_CIPHERTEXT.",
    };
  }

  return {
    configured: false,
    hasRawSecret: false,
    hasCiphertext: false,
    message:
      "Entity secret is not configured. Set CIRCLE_ENTITY_SECRET and CIRCLE_ENTITY_SECRET_CIPHERTEXT in your environment.",
  };
}

/**
 * Get a masked preview of the ciphertext for status display.
 * Shows only the first 4 and last 4 characters.
 */
export function getMaskedCiphertext(): string | null {
  const ciphertext = process.env.CIRCLE_ENTITY_SECRET_CIPHERTEXT;
  if (!ciphertext || ciphertext.length < 12) return null;
  return `${ciphertext.slice(0, 4)}...${ciphertext.slice(-4)}`;
}

/**
 * Placeholder: Generate entity secret ciphertext.
 *
 * Circle requires the entity secret to be encrypted using their public key
 * via RSA-OAEP. This operation should be done using Circle's SDK or CLI tool.
 *
 * This function is a placeholder to document the expected flow.
 */
export function generateEntitySecretCiphertext(): never {
  throw new Error(
    "Entity secret ciphertext generation is not implemented yet. " +
      "Generate it using Circle's documented flow and store it in CIRCLE_ENTITY_SECRET_CIPHERTEXT."
  );
}
