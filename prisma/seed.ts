import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

/**
 * Dev-only seed script: one Organization + one User per role.
 *
 * NOT executed as part of this task (no live database yet — see the task
 * README). It's written and type-checked now so that once Postgres is
 * unblocked, `npx prisma db seed` (wired below via package.json's
 * `prisma.seed` config, per Prisma's standard convention) immediately
 * makes the whole auth/RBAC system exercisable end-to-end.
 *
 * DEV-ONLY PASSWORD — see `.env.example` for the same note. This is not a
 * real secret; it exists only so local development / manual QA has a known
 * credential to sign in with. Every seeded account shares it for
 * simplicity. Never reuse this password scheme in a real deployment, and
 * never seed this data against a production database.
 */
const DEV_SEED_PASSWORD = "Purity-Dev-2026!";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash(DEV_SEED_PASSWORD, 12);

  const organization = await prisma.organization.upsert({
    where: { id: "org_purity_dental" },
    update: {},
    create: {
      id: "org_purity_dental",
      name: "Purity Dental Clinic",
      timezone: "America/New_York",
    },
  });

  const usersToSeed = [
    {
      id: "user_admin",
      email: "admin@purity.dev",
      name: "Purity Admin",
      role: "ADMIN" as const,
    },
    {
      // Matches `currentProvider` in src/lib/sample-data.ts.
      id: "user_dr_avery",
      email: "emily.avery@purity.dev",
      name: "Dr. Emily Avery",
      role: "DENTIST" as const,
    },
    {
      // Matches `currentHygienist` in src/lib/sample-data.ts.
      id: "user_dana_reyes",
      email: "dana.reyes@purity.dev",
      name: "Dana Reyes, RDH",
      role: "HYGIENIST" as const,
    },
    {
      // Matches the Receptionist portal's shell identity in nav-config.tsx.
      id: "user_priya_nair",
      email: "priya.nair@purity.dev",
      name: "Priya Nair",
      role: "RECEPTIONIST" as const,
    },
    {
      // Matches `currentPatient` (Sarah Johnson) in src/lib/sample-data.ts.
      id: "user_sarah_johnson",
      email: "sarah.johnson@example.com",
      name: "Sarah Johnson",
      role: "PATIENT" as const,
    },
  ];

  for (const u of usersToSeed) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: {},
      create: {
        id: u.id,
        organizationId: organization.id,
        role: u.role,
        email: u.email,
        name: u.name,
        passwordHash,
      },
    });
  }

  console.log("Seeded organization:", organization.name);
  console.log("Seeded users (all share the dev-only password documented in .env.example):");
  for (const u of usersToSeed) {
    console.log(`  - ${u.role.padEnd(12)} ${u.email}`);
  }
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
