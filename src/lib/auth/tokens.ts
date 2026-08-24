import { randomBytes, createHash } from "node:crypto";

/**
 * Random token generation + hashing shared by session cookies and password
 * reset links. The pattern for both is identical: generate a high-entropy
 * random token, hand the RAW token to the client (cookie value / reset
 * link), and persist only a SHA-256 hash of it server-side. That way a
 * database leak (backup dump, read replica, SQL injection elsewhere) can't
 * be replayed as a live session or reset link — the attacker would need the
 * raw token, which never touches the database.
 */

/** Generate a cryptographically random, URL-safe token (256 bits of entropy). */
export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

/** SHA-256 hash of a raw token, for storage/lookup (never store the raw token). */
export function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}
