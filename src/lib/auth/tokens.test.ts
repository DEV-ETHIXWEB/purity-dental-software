import { describe, expect, it } from "vitest";
import { generateToken, hashToken } from "./tokens";

describe("generateToken", () => {
  it("produces a URL-safe token with adequate entropy/length (256 bits, base64url)", () => {
    const token = generateToken();
    // 32 raw bytes base64url-encoded (no padding) => 43 characters.
    expect(token.length).toBe(43);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("generates different tokens on each call", () => {
    const a = generateToken();
    const b = generateToken();
    expect(a).not.toBe(b);
  });
});

describe("hashToken", () => {
  it("is deterministic: hashing the same raw token twice produces the same hash", () => {
    const raw = generateToken();
    expect(hashToken(raw)).toBe(hashToken(raw));
  });

  it("produces different hashes for different tokens", () => {
    const a = generateToken();
    const b = generateToken();
    expect(hashToken(a)).not.toBe(hashToken(b));
  });

  it("produces a 64-char lowercase hex SHA-256 digest", () => {
    const hash = hashToken("fixed-input-for-shape-check");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("never returns the raw token as its own hash", () => {
    const raw = generateToken();
    expect(hashToken(raw)).not.toBe(raw);
  });
});
