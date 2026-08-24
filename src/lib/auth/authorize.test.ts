import { describe, expect, it, vi } from "vitest";
import type { CurrentSession } from "./session";

/**
 * `authorize.ts` resolves the session via `getCurrentSession()` from
 * `session.ts`, which itself talks to `next/headers` + Prisma — neither
 * available/meaningful outside a real Next request with a live DB. The role
 * *matching* logic in `requireRole`/`requireSession`/`assertSameOrganization`
 * is pure once you have a session object, though, so `session.ts` is mocked
 * here to supply a fake `CurrentSession` and isolate that logic.
 */
vi.mock("./session", () => ({
  getCurrentSession: vi.fn(),
}));

function makeSession(overrides: Partial<CurrentSession["user"]> = {}): CurrentSession {
  return {
    sessionId: "sess_1",
    expiresAt: new Date(Date.now() + 1000 * 60 * 60),
    user: {
      id: "user_1",
      organizationId: "org_1",
      role: "DENTIST",
      email: "dentist@example.com",
      name: "Dr. Test",
      ...overrides,
    },
  };
}

describe("requireSession", () => {
  it("returns the session when signed in", async () => {
    const { getCurrentSession } = await import("./session");
    const { requireSession } = await import("./authorize");
    const session = makeSession();
    vi.mocked(getCurrentSession).mockResolvedValue(session);

    await expect(requireSession()).resolves.toBe(session);
  });

  it("throws AuthorizationError('UNAUTHENTICATED') when not signed in", async () => {
    const { getCurrentSession } = await import("./session");
    const { requireSession, AuthorizationError } = await import("./authorize");
    vi.mocked(getCurrentSession).mockResolvedValue(null);

    await expect(requireSession()).rejects.toBeInstanceOf(AuthorizationError);
    try {
      await requireSession();
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(AuthorizationError);
      expect((err as InstanceType<typeof AuthorizationError>).code).toBe("UNAUTHENTICATED");
    }
  });
});

describe("requireRole", () => {
  it("allows a role that's in the allowed list", async () => {
    const { getCurrentSession } = await import("./session");
    const { requireRole } = await import("./authorize");
    const session = makeSession({ role: "DENTIST" });
    vi.mocked(getCurrentSession).mockResolvedValue(session);

    await expect(requireRole(["DENTIST", "ADMIN"])).resolves.toBe(session);
  });

  it("rejects a role that's not in the allowed list with FORBIDDEN", async () => {
    const { getCurrentSession } = await import("./session");
    const { requireRole, AuthorizationError } = await import("./authorize");
    const session = makeSession({ role: "HYGIENIST" });
    vi.mocked(getCurrentSession).mockResolvedValue(session);

    try {
      await requireRole(["DENTIST", "ADMIN"]);
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(AuthorizationError);
      expect((err as InstanceType<typeof AuthorizationError>).code).toBe("FORBIDDEN");
    }
  });

  it("rejects with UNAUTHENTICATED (not FORBIDDEN) when there's no session at all", async () => {
    const { getCurrentSession } = await import("./session");
    const { requireRole, AuthorizationError } = await import("./authorize");
    vi.mocked(getCurrentSession).mockResolvedValue(null);

    try {
      await requireRole(["DENTIST"]);
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(AuthorizationError);
      expect((err as InstanceType<typeof AuthorizationError>).code).toBe("UNAUTHENTICATED");
    }
  });

  it("checks role membership exactly — a role not explicitly listed is rejected even if 'similar'", async () => {
    const { getCurrentSession } = await import("./session");
    const { requireRole } = await import("./authorize");
    const session = makeSession({ role: "PATIENT" });
    vi.mocked(getCurrentSession).mockResolvedValue(session);

    await expect(requireRole(["DENTIST", "HYGIENIST", "RECEPTIONIST"])).rejects.toThrow();
  });
});

describe("assertSameOrganization", () => {
  it("does not throw when organizationId matches", async () => {
    const { assertSameOrganization } = await import("./authorize");
    const session = makeSession({ organizationId: "org_abc" });
    expect(() => assertSameOrganization(session, "org_abc")).not.toThrow();
  });

  it("throws AuthorizationError('FORBIDDEN') when organizationId does not match", async () => {
    const { assertSameOrganization, AuthorizationError } = await import("./authorize");
    const session = makeSession({ organizationId: "org_abc" });
    expect(() => assertSameOrganization(session, "org_other_tenant")).toThrow(AuthorizationError);
    try {
      assertSameOrganization(session, "org_other_tenant");
      expect.unreachable();
    } catch (err) {
      expect((err as InstanceType<typeof AuthorizationError>).code).toBe("FORBIDDEN");
    }
  });
});
