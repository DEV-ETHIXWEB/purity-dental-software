import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getEnv } from "@/lib/env";

// Prisma 7 requires an explicit driver adapter at runtime (the schema file no
// longer carries a connection URL). This module wires that up once and
// reuses a single PrismaClient instance across hot reloads in development.
//
// The PrismaPg adapter is constructed lazily (inside getPrisma()) rather
// than at module scope, via getEnv() — matching getEnv()'s own "validate at
// request time, not import time" contract (see src/lib/env.ts) so
// `next build`'s static analysis of route modules that merely import this
// file doesn't require DATABASE_URL to be set.

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: getEnv().DATABASE_URL });
  return new PrismaClient({ adapter });
}

export const prisma =
  globalForPrisma.prisma ??
  new Proxy({} as PrismaClient, {
    // `receiver` is intentionally omitted (defaults to `client`, not this
    // Proxy) — Prisma's model delegates (e.g. `prisma.user`) are getters
    // that close over the real client internally, and forwarding the
    // Proxy as `receiver` would break that `this` binding.
    get(_target, prop) {
      const client = (globalForPrisma.prisma ??= createPrismaClient());
      return Reflect.get(client, prop);
    },
  });
