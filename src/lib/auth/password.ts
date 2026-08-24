import bcrypt from "bcryptjs";

/**
 * Password hashing — bcryptjs.
 *
 * Chosen over `@node-rs/argon2` (or native `bcrypt`) specifically because it
 * is a pure-JS implementation with zero native bindings: nothing to compile,
 * no prebuilt-binary download step, no risk of failing to install on a
 * machine without a matching toolchain/ABI. That matters a lot for this
 * project's current state (no live DB, environment still being stood up) —
 * we want `npm install` to be boring and portable. bcrypt's throughput is
 * lower than argon2id's, but for an interactive login form (a handful of
 * hashes/sec, not a high-QPS API) that difference is irrelevant, and bcrypt
 * remains a well-vetted, OWASP-approved choice for password storage.
 *
 * Cost factor 12 is OWASP's current baseline recommendation for bcrypt
 * (~250ms/hash on modern hardware) — high enough to resist offline
 * brute-force, low enough not to bottleneck login.
 */

const SALT_ROUNDS = 12;

/** Hash a plaintext password for storage in `User.passwordHash`. Never log the input or output. */
export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, SALT_ROUNDS);
}

/** Verify a plaintext password against a stored bcrypt hash. Constant-time via bcryptjs internally. */
export async function verifyPassword(
  plaintext: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plaintext, hash);
}
