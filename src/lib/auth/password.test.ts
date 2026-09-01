import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("hashPassword / verifyPassword", () => {
  it("hashes a password and verifies the correct plaintext against it", async () => {
    const hash = await hashPassword("Correct-Horse-1");
    expect(hash).not.toBe("Correct-Horse-1");
    await expect(verifyPassword("Correct-Horse-1", hash)).resolves.toBe(true);
  });

  it("rejects an incorrect password against a valid hash", async () => {
    const hash = await hashPassword("Correct-Horse-1");
    await expect(verifyPassword("Wrong-Password-1", hash)).resolves.toBe(false);
  });

  it("produces different hashes for the same password (random salt)", async () => {
    const [hashA, hashB] = await Promise.all([
      hashPassword("Same-Password-1"),
      hashPassword("Same-Password-1"),
    ]);
    expect(hashA).not.toBe(hashB);
    // Both must still independently verify against the same plaintext.
    await expect(verifyPassword("Same-Password-1", hashA)).resolves.toBe(true);
    await expect(verifyPassword("Same-Password-1", hashB)).resolves.toBe(true);
  });

  it("embeds the bcrypt cost factor (12) in the hash, confirming SALT_ROUNDS is applied", async () => {
    const hash = await hashPassword("Cost-Factor-Check-1");
    // bcrypt hash format: $<algorithm>$<cost>$<22-char-salt><31-char-hash>
    const match = hash.match(/^\$2[aby]\$(\d{2})\$/);
    expect(match).not.toBeNull();
    expect(Number(match?.[1])).toBe(12);
  });

  it("hashing is reasonably slow (cost factor sanity check, not exact timing)", async () => {
    const start = performance.now();
    await hashPassword("Timing-Sanity-Check-1");
    const elapsedMs = performance.now() - start;
    // Cost factor 12 should take on the order of tens-to-hundreds of ms, not
    // sub-millisecond (which would indicate SALT_ROUNDS got dropped to
    // something trivial like 1-4, or hashing was accidentally skipped).
    // Generous lower bound to avoid flaking on fast CI hardware.
    expect(elapsedMs).toBeGreaterThan(5);
  });
});
