import { createHash, randomBytes } from "crypto";

/**
 * Generates a new API key in the format: aw_live_<32 random bytes hex>
 * Returns both the raw key (shown once to user) and the hash (stored in DB).
 */
export function generateApiKey(): { raw: string; hash: string; prefix: string } {
  const secret = randomBytes(32).toString("hex");
  const raw = `aw_live_${secret}`;
  const hash = hashApiKey(raw);
  const prefix = raw.slice(0, 12); // "aw_live_xxxx"
  return { raw, hash, prefix };
}

/**
 * SHA-256 hash of the raw key. This is what we store in the DB.
 */
export function hashApiKey(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/**
 * Extracts Bearer token from Authorization header.
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7).trim();
}
