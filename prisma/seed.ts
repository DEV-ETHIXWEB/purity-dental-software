import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

/**
 * Dev-only seed script: one Organization, one User per role, and the full
 * demo dataset (patients, appointments, treatment plans, perio charts,
 * invoices, and messaging threads) that the UI previously read from the
 * hardcoded `src/lib/sample-data.ts`. Values here are ported 1:1 from that
 * file so seeded content matches what the app already showed — only the
 * source moved from in-memory fixtures to real Postgres rows. Every model
 * upsert is keyed by an explicit id so this script stays idempotent and can
 * be re-run against the same dev database safely.
 *
 * DEV-ONLY PASSWORD — see `.env.example` for the same note. This is not a
 * real secret; it exists only so local development / manual QA has a known
 * credential to sign in with. Every seeded staff/patient account shares it.
 * Never reuse this password scheme in a real deployment, and never seed this
 * data against a production database.
 */
const DEV_SEED_PASSWORD = "Purity-Dev-2026!";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const ORG_ID = "org_purity_dental";

// ---------------------------------------------------------------------------
// Users (staff + the one patient-portal login)
// ---------------------------------------------------------------------------

const USERS = [
  { id: "user_admin", email: "admin@purity.dev", name: "Purity Admin", role: "ADMIN" as const, avatarUrl: "/avatars/admin.jpg" },
  { id: "user_dr_avery", email: "emily.avery@purity.dev", name: "Dr. Emily Avery", role: "DENTIST" as const, avatarUrl: "/avatars/dr-avery.jpg" },
  { id: "user_dr_kapoor", email: "raj.kapoor@purity.dev", name: "Dr. Raj Kapoor", role: "DENTIST" as const, avatarUrl: "/avatars/dr-kapoor.jpg" },
  { id: "user_dana_reyes", email: "dana.reyes@purity.dev", name: "Dana Reyes, RDH", role: "HYGIENIST" as const, avatarUrl: "/avatars/dana-reyes.jpg" },
  { id: "user_priya_nair", email: "priya.nair@purity.dev", name: "Priya Nair", role: "RECEPTIONIST" as const, avatarUrl: "/avatars/priya-nair.jpg" },
  { id: "user_sarah_johnson", email: "sarah.johnson@example.com", name: "Sarah Johnson", role: "PATIENT" as const, avatarUrl: "/avatars/sarah-johnson.jpg" },
];

const PROVIDER_AVERY = "user_dr_avery";
const PROVIDER_KAPOOR = "user_dr_kapoor";
const PROVIDER_REYES = "user_dana_reyes";

// ---------------------------------------------------------------------------
// Patients — ported from sample-data.ts `patients`
// ---------------------------------------------------------------------------

const PATIENTS = [
  {
    id: "pat_sarah_johnson",
    userId: "user_sarah_johnson",
    photoUrl: "/avatars/sarah-johnson.jpg",
    firstName: "Sarah",
    lastName: "Johnson",
    dateOfBirth: "1990-04-12",
    sex: "FEMALE" as const,
    phone: "(555) 201-4488",
    email: "sarah.johnson@example.com",
    insuranceProvider: "Delta Dental",
    insurancePlan: "PPO Plus",
    medicalAlerts: ["Penicillin allergy", "Sensitive gums"],
    lastCleaningAt: "2026-05-14",
    recallStatus: "Due in 2 weeks",
    nextApptAt: "2026-08-27T14:00:00.000Z",
  },
  {
    id: "pat_james_carter",
    photoUrl: "/avatars/james-carter.jpg",
    firstName: "James",
    lastName: "Carter",
    dateOfBirth: "1985-11-02",
    sex: "MALE" as const,
    phone: "(555) 340-9021",
    email: "james.carter@example.com",
    insuranceProvider: "Cigna",
    insurancePlan: "Dental Care 500",
    medicalAlerts: [],
    lastCleaningAt: "2026-07-02",
    recallStatus: "On track",
    nextApptAt: "2026-08-26T09:30:00.000Z",
  },
  {
    id: "pat_olivia_martinez",
    photoUrl: "/avatars/olivia-martinez.jpg",
    firstName: "Olivia",
    lastName: "Martinez",
    dateOfBirth: "2001-02-19",
    sex: "FEMALE" as const,
    phone: "(555) 118-7742",
    email: "olivia.martinez@example.com",
    insuranceProvider: "MetLife",
    insurancePlan: "Essential",
    medicalAlerts: ["Latex allergy"],
    lastCleaningAt: "2026-03-21",
    recallStatus: "Overdue",
    nextApptAt: null,
  },
  {
    id: "pat_ethan_walker",
    photoUrl: "/avatars/ethan-walker.jpg",
    firstName: "Ethan",
    lastName: "Walker",
    dateOfBirth: "1978-06-30",
    sex: "MALE" as const,
    phone: "(555) 902-3315",
    email: "ethan.walker@example.com",
    insuranceProvider: "Aetna",
    insurancePlan: "PPO",
    medicalAlerts: ["Diabetic"],
    lastCleaningAt: "2026-01-09",
    recallStatus: "Overdue",
    nextApptAt: "2026-08-28T11:00:00.000Z",
  },
  {
    id: "pat_michael_lee",
    photoUrl: "/avatars/michael-lee.jpg",
    firstName: "Michael",
    lastName: "Lee",
    dateOfBirth: "1995-09-08",
    sex: "MALE" as const,
    phone: "(555) 774-6620",
    email: "michael.lee@example.com",
    insuranceProvider: "Guardian",
    insurancePlan: "Signature",
    medicalAlerts: [],
    lastCleaningAt: "2026-06-18",
    recallStatus: "On track",
    nextApptAt: "2026-08-25T15:30:00.000Z",
  },
  {
    id: "pat_emma_williams",
    photoUrl: "/avatars/emma-williams.jpg",
    firstName: "Emma",
    lastName: "Williams",
    dateOfBirth: "1988-12-24",
    sex: "FEMALE" as const,
    phone: "(555) 556-1290",
    email: "emma.williams@example.com",
    insuranceProvider: "Delta Dental",
    insurancePlan: "PPO Plus",
    medicalAlerts: ["Sensitive gums"],
    lastCleaningAt: "2026-04-30",
    recallStatus: "Due in 3 weeks",
    nextApptAt: "2026-08-31T10:00:00.000Z",
  },
  {
    id: "pat_daniel_brooks",
    photoUrl: "/avatars/daniel-brooks.jpg",
    firstName: "Daniel",
    lastName: "Brooks",
    dateOfBirth: "1972-03-15",
    sex: "MALE" as const,
    phone: "(555) 683-2201",
    email: "daniel.brooks@example.com",
    insuranceProvider: "Cigna",
    insurancePlan: "Dental Care 500",
    medicalAlerts: [],
    lastCleaningAt: "2025-12-11",
    recallStatus: "Overdue",
    nextApptAt: null,
    status: "INACTIVE" as const,
  },
  {
    id: "pat_ava_nguyen",
    photoUrl: "/avatars/ava-nguyen.jpg",
    firstName: "Ava",
    lastName: "Nguyen",
    dateOfBirth: "1999-07-21",
    sex: "FEMALE" as const,
    phone: "(555) 447-8813",
    email: "ava.nguyen@example.com",
    insuranceProvider: "MetLife",
    insurancePlan: "Essential",
    medicalAlerts: ["Penicillin allergy"],
    lastCleaningAt: "2026-07-25",
    recallStatus: "On track",
    nextApptAt: "2026-08-26T13:00:00.000Z",
  },
];

// ---------------------------------------------------------------------------
// Appointments — ported from sample-data.ts `appointments` +
// `additionalPracticeAppointments`
// ---------------------------------------------------------------------------

const APPOINTMENTS = [
  { id: "appt_1", patientId: "pat_michael_lee", providerId: PROVIDER_AVERY, procedureType: "Routine Cleaning", status: "CONFIRMED" as const, startTime: "2026-08-24T13:00:00.000Z", endTime: "2026-08-24T13:45:00.000Z" },
  { id: "appt_2", patientId: "pat_ava_nguyen", providerId: PROVIDER_AVERY, procedureType: "Consultation", status: "SCHEDULED" as const, startTime: "2026-08-24T15:15:00.000Z", endTime: "2026-08-24T15:45:00.000Z" },
  { id: "appt_3", patientId: "pat_james_carter", providerId: PROVIDER_AVERY, procedureType: "Crown Fitting", status: "CONFIRMED" as const, startTime: "2026-08-25T09:30:00.000Z", endTime: "2026-08-25T10:30:00.000Z" },
  { id: "appt_4", patientId: "pat_sarah_johnson", providerId: PROVIDER_AVERY, procedureType: "Root Canal Follow-up", status: "SCHEDULED" as const, startTime: "2026-08-27T14:00:00.000Z", endTime: "2026-08-27T15:00:00.000Z" },
  { id: "appt_5", patientId: "pat_ethan_walker", providerId: PROVIDER_AVERY, procedureType: "Filling", status: "SCHEDULED" as const, startTime: "2026-08-28T11:00:00.000Z", endTime: "2026-08-28T11:45:00.000Z" },
  { id: "appt_6", patientId: "pat_emma_williams", providerId: PROVIDER_AVERY, procedureType: "Whitening", status: "SCHEDULED" as const, startTime: "2026-08-31T10:00:00.000Z", endTime: "2026-08-31T11:00:00.000Z" },
  { id: "appt_7", patientId: "pat_olivia_martinez", providerId: PROVIDER_AVERY, procedureType: "Cleaning", status: "COMPLETED" as const, startTime: "2026-08-20T14:00:00.000Z", endTime: "2026-08-20T14:45:00.000Z", completedOnTime: true },
  { id: "appt_8", patientId: "pat_daniel_brooks", providerId: PROVIDER_AVERY, procedureType: "Extraction", status: "CANCELLED" as const, startTime: "2026-08-21T09:00:00.000Z", endTime: "2026-08-21T09:45:00.000Z" },
  { id: "appt_rc_1", patientId: "pat_emma_williams", providerId: PROVIDER_KAPOOR, procedureType: "New Patient Exam", status: "CHECKED_IN" as const, startTime: "2026-08-24T14:30:00.000Z", endTime: "2026-08-24T15:15:00.000Z" },
  { id: "appt_rc_2", patientId: "pat_daniel_brooks", providerId: PROVIDER_REYES, procedureType: "Periodontal Maintenance", status: "NO_SHOW" as const, startTime: "2026-08-24T11:00:00.000Z", endTime: "2026-08-24T11:45:00.000Z" },
  { id: "appt_rc_3", patientId: "pat_olivia_martinez", providerId: PROVIDER_REYES, procedureType: "Cleaning", status: "CHECKED_IN" as const, startTime: "2026-08-24T10:00:00.000Z", endTime: "2026-08-24T10:45:00.000Z" },
  { id: "appt_rc_4", patientId: "pat_ava_nguyen", providerId: PROVIDER_KAPOOR, procedureType: "Filling", status: "SCHEDULED" as const, startTime: "2026-08-25T13:00:00.000Z", endTime: "2026-08-25T13:45:00.000Z" },
];

// ---------------------------------------------------------------------------
// Treatment plan items — ported from sample-data.ts `treatmentPlanItems`
// ---------------------------------------------------------------------------

const TREATMENT_PLAN_ITEMS = [
  { id: "tpi_1", patientId: "pat_sarah_johnson", tooth: "#14", quadrant: "Upper Left", procedure: "Composite Filling", status: "PLANNED" as const, recallInterval: "6 months" },
  { id: "tpi_2", patientId: "pat_sarah_johnson", tooth: "#3", quadrant: "Upper Right", procedure: "Crown", status: "ACTIVE" as const, recallInterval: "3 months" },
  { id: "tpi_3", patientId: "pat_sarah_johnson", tooth: "#19", quadrant: "Lower Left", procedure: "Root Canal", status: "COMPLETED" as const, recallInterval: "12 months" },
  { id: "tpi_4", patientId: "pat_james_carter", tooth: "#8", quadrant: "Upper Anterior", procedure: "Veneer", status: "PLANNED" as const, recallInterval: "6 months" },
  { id: "tpi_5", patientId: "pat_ethan_walker", tooth: "#30", quadrant: "Lower Right", procedure: "Extraction", status: "DECLINED" as const, recallInterval: "N/A" },
];

// ---------------------------------------------------------------------------
// Perio chart entries — ported from sample-data.ts `perioChartEntries`
// ---------------------------------------------------------------------------

const PERIO_CHART_ENTRIES = [
  { patientId: "pat_sarah_johnson", chartedAt: "2026-05-14", avgPocketDepthMm: 2.8, bleedingPercent: 9 },
  { patientId: "pat_james_carter", chartedAt: "2026-07-02", avgPocketDepthMm: 2.3, bleedingPercent: 4 },
  { patientId: "pat_olivia_martinez", chartedAt: "2026-03-21", avgPocketDepthMm: 3.4, bleedingPercent: 18 },
  { patientId: "pat_ethan_walker", chartedAt: "2026-01-09", avgPocketDepthMm: 4.1, bleedingPercent: 27 },
  { patientId: "pat_michael_lee", chartedAt: "2026-06-18", avgPocketDepthMm: 2.1, bleedingPercent: 3 },
  { patientId: "pat_emma_williams", chartedAt: "2026-04-30", avgPocketDepthMm: 2.6, bleedingPercent: 8 },
];

// ---------------------------------------------------------------------------
// Invoices + line items — ported from sample-data.ts `invoices`
// ---------------------------------------------------------------------------

const INVOICES = [
  {
    id: "inv_1001", patientId: "pat_sarah_johnson", providerId: PROVIDER_AVERY, status: "PAID" as const, issuedAt: "2026-08-01", dueAt: "2026-08-15",
    paymentMethod: "VISA" as const, paymentMethodLast4: "4242",
    lineItems: [
      { id: "li_1", description: "Comprehensive Exam", procedureCode: "D0150", quantity: 1, unitPriceCents: 12000 },
      { id: "li_2", description: "Bitewing X-Rays", procedureCode: "D0274", quantity: 1, unitPriceCents: 6500 },
    ],
  },
  {
    id: "inv_1002", patientId: "pat_james_carter", providerId: PROVIDER_AVERY, status: "PENDING" as const, issuedAt: "2026-08-10", dueAt: "2026-09-01",
    lineItems: [{ id: "li_3", description: "Porcelain Crown", procedureCode: "D2740", tooth: "#3", quadrant: "Upper Right", quantity: 1, unitPriceCents: 95000 }],
  },
  {
    id: "inv_1003", patientId: "pat_olivia_martinez", providerId: PROVIDER_AVERY, status: "OVERDUE" as const, issuedAt: "2026-07-05", dueAt: "2026-07-20",
    lineItems: [
      { id: "li_4", description: "Routine Cleaning", procedureCode: "D1110", quantity: 1, unitPriceCents: 9500 },
      { id: "li_5", description: "Fluoride Treatment", procedureCode: "D1206", quantity: 1, unitPriceCents: 4000 },
    ],
  },
  {
    id: "inv_1004", patientId: "pat_ethan_walker", providerId: PROVIDER_AVERY, status: "OVERDUE" as const, issuedAt: "2026-06-28", dueAt: "2026-07-12",
    lineItems: [
      { id: "li_6", description: "Tooth Extraction", procedureCode: "D7140", tooth: "#30", quadrant: "Lower Right", quantity: 1, unitPriceCents: 22000 },
      { id: "li_7", description: "Post-Op Follow-up", procedureCode: "D9430", quantity: 1, unitPriceCents: 10000 },
    ],
  },
  {
    id: "inv_1005", patientId: "pat_michael_lee", providerId: PROVIDER_AVERY, status: "PAID" as const, issuedAt: "2026-08-12", dueAt: "2026-08-26",
    paymentMethod: "MASTERCARD" as const, paymentMethodLast4: "5555",
    lineItems: [{ id: "li_8", description: "Routine Cleaning", procedureCode: "D1110", quantity: 1, unitPriceCents: 9500 }],
  },
  {
    id: "inv_1006", patientId: "pat_emma_williams", providerId: PROVIDER_AVERY, status: "PENDING" as const, issuedAt: "2026-08-18", dueAt: "2026-09-05",
    lineItems: [{ id: "li_9", description: "Teeth Whitening", procedureCode: "D9972", quantity: 1, unitPriceCents: 35000 }],
  },
  {
    id: "inv_1007", patientId: "pat_daniel_brooks", providerId: PROVIDER_REYES, status: "OVERDUE" as const, issuedAt: "2026-06-01", dueAt: "2026-06-15",
    lineItems: [{ id: "li_10", description: "Deep Cleaning (per quadrant)", procedureCode: "D4341", quantity: 2, unitPriceCents: 18000 }],
  },
  {
    id: "inv_1008", patientId: "pat_ava_nguyen", providerId: PROVIDER_AVERY, status: "PAID" as const, issuedAt: "2026-08-05", dueAt: "2026-08-19",
    paymentMethod: "CASH" as const,
    lineItems: [{ id: "li_11", description: "Comprehensive Exam", procedureCode: "D0150", quantity: 1, unitPriceCents: 12000 }],
  },
];

/**
 * Placeholder billing-adjustment heuristics (not real insurance-plan
 * adjudication) — see the matching comment on Invoice.insuranceAdjustmentCents
 * in prisma/schema.prisma. Applied identically here and in
 * createInvoiceFromTreatment (src/lib/data/billing.ts) so seeded invoices and
 * ones created live through the app compute totals the same way.
 */
const INSURANCE_ADJUSTMENT_RATE = 0.15;
const TAX_RATE = 0.08;

function computeInvoiceTotals(subtotalCents: number, hasInsurance: boolean) {
  const insuranceAdjustmentCents = hasInsurance ? Math.round(subtotalCents * INSURANCE_ADJUSTMENT_RATE) : 0;
  const taxCents = Math.round((subtotalCents - insuranceAdjustmentCents) * TAX_RATE);
  const totalCents = subtotalCents - insuranceAdjustmentCents + taxCents;
  return { insuranceAdjustmentCents, taxCents, totalCents };
}

/**
 * A patient's `balanceCents` must be derived from their own invoices, not
 * hand-maintained separately — the two are ported from the same
 * `sample-data.ts` fixture, and a previous version of this script carried
 * both as independent hardcoded numbers, which had already drifted out of
 * sync for 5 of the 8 seeded patients (e.g. Sarah Johnson's only invoice is
 * PAID, but her old hardcoded balance was still $120). Summing the
 * PENDING/OVERDUE invoice totals per patient — the same definition of
 * "outstanding" used by `billingSummary()` in `src/lib/data/billing.ts` — is
 * the single source of truth this is kept consistent with going forward.
 */
const OUTSTANDING_CENTS_BY_PATIENT = new Map<string, number>();
for (const inv of INVOICES) {
  if (inv.status !== "PENDING" && inv.status !== "OVERDUE") continue;
  const subtotalCents = inv.lineItems.reduce((sum, li) => sum + li.quantity * li.unitPriceCents, 0);
  const hasInsurance = !!PATIENTS.find((p) => p.id === inv.patientId)?.insuranceProvider;
  const { totalCents } = computeInvoiceTotals(subtotalCents, hasInsurance);
  OUTSTANDING_CENTS_BY_PATIENT.set(inv.patientId, (OUTSTANDING_CENTS_BY_PATIENT.get(inv.patientId) ?? 0) + totalCents);
}

// ---------------------------------------------------------------------------
// Waitlist — ported from sample-data.ts `scheduleWaitlist`
// ---------------------------------------------------------------------------

const WAITLIST_ENTRIES = [
  { id: "wait_1", patientId: "pat_ava_nguyen", reason: "Open time / ASAP", requestedProcedure: "Cleaning" },
  { id: "wait_2", patientId: "pat_daniel_brooks", reason: "Open time / ASAP", requestedProcedure: "Deep Cleaning" },
];

// ---------------------------------------------------------------------------
// Messaging — ported from sample-data.ts `conversations` + its message log
// ---------------------------------------------------------------------------

const CONVERSATIONS: Array<{
  id: string;
  patientId: string;
  messages: Array<{ id: string; sender: "PROVIDER" | "PATIENT"; senderUserId?: string; body: string; sentAt: string }>;
}> = [
  {
    id: "conv_sarah_johnson",
    patientId: "pat_sarah_johnson",
    messages: [
      { id: "msg_sj_1", sender: "PROVIDER", senderUserId: PROVIDER_REYES, body: "Hi Sarah, just confirming your cleaning is booked for Aug 27 at 2:00 PM. See you then!", sentAt: "2026-08-22T15:05:00.000Z" },
      { id: "msg_sj_2", sender: "PATIENT", body: "Thanks for the reminder — I'll be there. Should I keep taking the sensitivity toothpaste?", sentAt: "2026-08-23T13:40:00.000Z" },
      { id: "msg_sj_3", sender: "PATIENT", body: "Also wanted to ask if the appointment will run long — I have a meeting right after.", sentAt: "2026-08-24T09:12:00.000Z" },
    ],
  },
  {
    id: "conv_olivia_martinez",
    patientId: "pat_olivia_martinez",
    messages: [
      { id: "msg_om_1", sender: "PROVIDER", senderUserId: PROVIDER_REYES, body: "Hi Olivia, our records show your recall cleaning is overdue. Do you have a few minutes to pick a time this week?", sentAt: "2026-08-20T16:00:00.000Z" },
      { id: "msg_om_2", sender: "PATIENT", body: "Sorry for the delay, things have been hectic. Can you send me some openings?", sentAt: "2026-08-23T11:22:00.000Z" },
      { id: "msg_om_3", sender: "PATIENT", body: "Also — is there a cancellation list I can join in case something opens up sooner?", sentAt: "2026-08-23T11:24:00.000Z" },
    ],
  },
  {
    id: "conv_ethan_walker",
    patientId: "pat_ethan_walker",
    messages: [
      { id: "msg_ew_1", sender: "PROVIDER", senderUserId: PROVIDER_REYES, body: "Hi Ethan, checking in after your extraction — how is the healing going?", sentAt: "2026-08-21T14:00:00.000Z" },
      { id: "msg_ew_2", sender: "PATIENT", body: "Healing well, thank you. Some mild soreness but nothing concerning.", sentAt: "2026-08-21T18:30:00.000Z" },
    ],
  },
  {
    id: "conv_michael_lee",
    patientId: "pat_michael_lee",
    messages: [
      { id: "msg_ml_1", sender: "PATIENT", body: "Quick question — does my plan cover fluoride treatment at tomorrow's visit?", sentAt: "2026-08-23T20:10:00.000Z" },
      { id: "msg_ml_2", sender: "PROVIDER", senderUserId: PROVIDER_REYES, body: "Yes, fluoride treatment is covered under your plan. See you tomorrow at 3:30 PM.", sentAt: "2026-08-23T20:45:00.000Z" },
    ],
  },
  {
    id: "conv_emma_williams",
    patientId: "pat_emma_williams",
    messages: [
      { id: "msg_ewi_1", sender: "PROVIDER", senderUserId: PROVIDER_REYES, body: "Hi Emma, your whitening appointment is confirmed for Aug 31 at 10:00 AM.", sentAt: "2026-08-22T10:00:00.000Z" },
      { id: "msg_ewi_2", sender: "PATIENT", body: "Great, thank you! Should I avoid coffee beforehand?", sentAt: "2026-08-24T08:15:00.000Z" },
    ],
  },
];

async function main() {
  const passwordHash = await bcrypt.hash(DEV_SEED_PASSWORD, 12);

  const organization = await prisma.organization.upsert({
    where: { id: ORG_ID },
    update: {},
    create: { id: ORG_ID, name: "Purity Dental Clinic", timezone: "America/New_York" },
  });

  for (const u of USERS) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: { avatarUrl: u.avatarUrl },
      create: { id: u.id, organizationId: organization.id, role: u.role, email: u.email, name: u.name, passwordHash, avatarUrl: u.avatarUrl },
    });
  }

  for (const p of PATIENTS) {
    await prisma.patient.upsert({
      where: { id: p.id },
      update: { photoUrl: p.photoUrl },
      create: {
        id: p.id,
        organizationId: organization.id,
        userId: p.userId ?? null,
        firstName: p.firstName,
        lastName: p.lastName,
        dateOfBirth: new Date(p.dateOfBirth),
        sex: p.sex,
        phone: p.phone,
        email: p.email,
        photoUrl: p.photoUrl,
        insuranceProvider: p.insuranceProvider,
        insurancePlan: p.insurancePlan,
        status: "status" in p ? p.status : "ACTIVE",
        balanceCents: OUTSTANDING_CENTS_BY_PATIENT.get(p.id) ?? 0,
        medicalAlerts: p.medicalAlerts,
        lastCleaningAt: p.lastCleaningAt ? new Date(p.lastCleaningAt) : null,
        recallStatus: p.recallStatus,
        nextApptAt: p.nextApptAt ? new Date(p.nextApptAt) : null,
      },
    });
  }

  for (const a of APPOINTMENTS) {
    // `update` deliberately only backfills `completedOnTime` (a column that
    // didn't exist until this feature — no live user action could have set
    // it to something this should preserve) — never `status`/times/etc,
    // which a live QA session may have legitimately changed since the last
    // seed run.
    await prisma.appointment.upsert({
      where: { id: a.id },
      update: { completedOnTime: "completedOnTime" in a ? a.completedOnTime : null },
      create: {
        id: a.id,
        organizationId: organization.id,
        patientId: a.patientId,
        providerId: a.providerId,
        procedureType: a.procedureType,
        status: a.status,
        completedOnTime: "completedOnTime" in a ? a.completedOnTime : null,
        startTime: new Date(a.startTime),
        endTime: new Date(a.endTime),
      },
    });
  }

  for (const t of TREATMENT_PLAN_ITEMS) {
    await prisma.treatmentPlanItem.upsert({
      where: { id: t.id },
      update: {},
      create: {
        id: t.id,
        organizationId: organization.id,
        patientId: t.patientId,
        tooth: t.tooth,
        quadrant: t.quadrant,
        procedure: t.procedure,
        status: t.status,
        recallInterval: t.recallInterval,
      },
    });
  }

  for (const [i, entry] of PERIO_CHART_ENTRIES.entries()) {
    const id = `perio_${i + 1}`;
    await prisma.perioChartEntry.upsert({
      where: { id },
      update: {},
      create: {
        id,
        organizationId: organization.id,
        patientId: entry.patientId,
        chartedAt: new Date(entry.chartedAt),
        avgPocketDepthMm: entry.avgPocketDepthMm,
        bleedingPercent: entry.bleedingPercent,
      },
    });
  }

  for (const inv of INVOICES) {
    const subtotalCents = inv.lineItems.reduce((sum, li) => sum + li.quantity * li.unitPriceCents, 0);
    const hasInsurance = !!PATIENTS.find((p) => p.id === inv.patientId)?.insuranceProvider;
    const { insuranceAdjustmentCents, taxCents, totalCents } = computeInvoiceTotals(subtotalCents, hasInsurance);
    // Same reasoning as the appointment upsert above: `update` only
    // backfills columns that didn't exist before this feature (provider,
    // tax/insurance breakdown, payment method) — never `status`, which a
    // live QA session (e.g. clicking "Mark as Paid") may have legitimately
    // changed since the last seed run.
    await prisma.invoice.upsert({
      where: { id: inv.id },
      update: {
        providerId: "providerId" in inv ? inv.providerId : null,
        insuranceAdjustmentCents,
        taxCents,
        totalCents,
        paymentMethod: "paymentMethod" in inv ? inv.paymentMethod : null,
        paymentMethodLast4: "paymentMethodLast4" in inv ? inv.paymentMethodLast4 : null,
      },
      create: {
        id: inv.id,
        organizationId: organization.id,
        patientId: inv.patientId,
        providerId: "providerId" in inv ? inv.providerId : null,
        status: inv.status,
        issuedAt: new Date(inv.issuedAt),
        dueAt: new Date(inv.dueAt),
        insuranceAdjustmentCents,
        taxCents,
        totalCents,
        paymentMethod: "paymentMethod" in inv ? inv.paymentMethod : null,
        paymentMethodLast4: "paymentMethodLast4" in inv ? inv.paymentMethodLast4 : null,
        lineItems: {
          create: inv.lineItems.map((li) => ({
            id: li.id,
            description: li.description,
            procedureCode: li.procedureCode,
            tooth: "tooth" in li ? li.tooth : null,
            quadrant: "quadrant" in li ? li.quadrant : null,
            quantity: li.quantity,
            unitPriceCents: li.unitPriceCents,
          })),
        },
      },
    });
  }

  for (const w of WAITLIST_ENTRIES) {
    await prisma.waitlistEntry.upsert({
      where: { id: w.id },
      update: {},
      create: {
        id: w.id,
        organizationId: organization.id,
        patientId: w.patientId,
        reason: w.reason,
        requestedProcedure: w.requestedProcedure,
      },
    });
  }

  for (const conv of CONVERSATIONS) {
    await prisma.conversation.upsert({
      where: { id: conv.id },
      update: {},
      create: {
        id: conv.id,
        organizationId: organization.id,
        patientId: conv.patientId,
        messages: {
          create: conv.messages.map((m) => ({
            id: m.id,
            sender: m.sender,
            senderUserId: m.senderUserId ?? null,
            body: m.body,
            sentAt: new Date(m.sentAt),
          })),
        },
      },
    });
  }

  console.log("Seeded organization:", organization.name);
  console.log(`Seeded ${USERS.length} users, ${PATIENTS.length} patients, ${APPOINTMENTS.length} appointments,`);
  console.log(`  ${TREATMENT_PLAN_ITEMS.length} treatment plan items, ${PERIO_CHART_ENTRIES.length} perio chart entries,`);
  console.log(`  ${INVOICES.length} invoices, ${WAITLIST_ENTRIES.length} waitlist entries, ${CONVERSATIONS.length} conversations.`);
  console.log("All staff/patient logins share the dev-only password documented in .env.example:");
  for (const u of USERS) {
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
