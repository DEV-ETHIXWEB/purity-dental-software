import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7 requires an explicit driver adapter at runtime (the schema file no
// longer carries a connection URL). This module wires that up once and
// reuses a single PrismaClient instance across hot reloads in development.
//
// NOTE: no migration has been run against a live database yet in this phase
// of the project — DATABASE_URL in `.env` is a local placeholder. Nothing in
// the Dentist portal UI queries this client yet; pages currently render from
// `src/lib/sample-data.ts`. This file exists so real data-fetching code can
// start importing `prisma` from here once a database is provisioned.

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
