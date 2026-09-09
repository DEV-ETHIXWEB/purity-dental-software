import "dotenv/config";
import { prisma } from "../src/lib/prisma";

/**
 * Dev-only helper: gives the seeded patient (Sarah Johnson) one outstanding
 * invoice so the Bills page can be reviewed with real content — the seed
 * deliberately leaves her balance at 0, which renders every "amount due"
 * surface empty.
 *
 * Idempotent: re-running replaces the previous demo invoice rather than
 * stacking another one up. Run `npx prisma db seed` to get back to the
 * pristine seeded state.
 */
async function main() {
  const patient = await prisma.patient.findFirst({ where: { email: "sarah.johnson@example.com" } });
  const provider = await prisma.user.findFirst({ where: { role: "DENTIST" } });
  if (!patient || !provider) throw new Error("Seed the database first: npx prisma db seed");

  const existing = await prisma.invoice.findMany({
    where: { patientId: patient.id, notes: "demo-invoice" },
    select: { id: true },
  });
  if (existing.length > 0) {
    const ids = existing.map((i) => i.id);
    await prisma.invoiceLineItem.deleteMany({ where: { invoiceId: { in: ids } } });
    await prisma.invoice.deleteMany({ where: { id: { in: ids } } });
  }

  const dueAt = new Date();
  dueAt.setDate(dueAt.getDate() + 12);

  const invoice = await prisma.invoice.create({
    data: {
      organizationId: patient.organizationId,
      patientId: patient.id,
      providerId: provider.id,
      status: "PENDING",
      issuedAt: new Date(),
      dueAt,
      // totalCents mirrors what createInvoiceFromTreatment would compute:
      // subtotal - insurance adjustment + tax.
      totalCents: 18000,
      insuranceAdjustmentCents: 12000,
      taxCents: 0,
      notes: "demo-invoice",
      lineItems: {
        create: [
          { description: "Routine Check-up", procedureCode: "D0120", quantity: 1, unitPriceCents: 22000 },
          { description: "Bitewing X-rays", procedureCode: "D0274", quantity: 1, unitPriceCents: 8000 },
        ],
      },
    },
  });

  await prisma.patient.update({
    where: { id: patient.id },
    data: { balanceCents: 18000 },
  });

  console.log(`Demo invoice ${invoice.id} created — Sarah's balance is now $180.00`);
}

main().finally(() => prisma.$disconnect());
