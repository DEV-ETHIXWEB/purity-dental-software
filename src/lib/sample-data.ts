/**
 * PLACEHOLDER SAMPLE DATA — pending real database wiring.
 *
 * Everything in this file is fictional seed data used to build out the
 * Dentist portal UI before Prisma migrations run against a live Postgres
 * instance. Shapes loosely mirror `prisma/schema.prisma` but are plain
 * TypeScript objects/functions, not database reads. Patient names
 * (Sarah Johnson, James Carter, Olivia Martinez, Ethan Walker, Michael Lee,
 * Emma Williams) match the names used in the original design mockups for
 * continuity; the rest of the roster is invented filler for list density.
 *
 * Replace call sites of these functions with real Prisma queries once
 * `DATABASE_URL` points at a provisioned database and auth/RBAC exists to
 * scope every query to the signed-in user's organizationId.
 */

export type AppointmentStatus =
  | "SCHEDULED"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export type InvoiceStatus = "PAID" | "PENDING" | "OVERDUE" | "DRAFT" | "VOID";

export type TreatmentPlanStatus = "PLANNED" | "ACTIVE" | "COMPLETED" | "DECLINED";

export interface SamplePatient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string; // ISO date
  sex: "MALE" | "FEMALE" | "OTHER";
  phone: string;
  email: string;
  photoUrl?: string;
  insuranceProvider: string;
  insurancePlan: string;
  balanceCents: number;
  medicalAlerts: string[];
  lastCleaningAt: string | null;
  recallStatus: string;
  nextApptAt: string | null;
  status: "Active" | "Inactive";
}

export interface SampleAppointment {
  id: string;
  patientId: string;
  providerId: string;
  providerName: string;
  procedureType: string;
  status: AppointmentStatus;
  startTime: string; // ISO datetime
  endTime: string;
  notes?: string;
}

export interface SampleTreatmentPlanItem {
  id: string;
  patientId: string;
  tooth: string;
  quadrant: string;
  procedure: string;
  status: TreatmentPlanStatus;
  recallInterval: string;
}

export interface SamplePerioChartEntry {
  patientId: string;
  chartedAt: string;
  avgPocketDepthMm: number;
  bleedingPercent: number;
}

export interface SampleInvoiceLineItem {
  id: string;
  description: string;
  procedureCode: string;
  quantity: number;
  unitPriceCents: number;
}

export interface SampleInvoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  status: InvoiceStatus;
  issuedAt: string;
  dueAt: string;
  lineItems: SampleInvoiceLineItem[];
}

export const currentProvider = {
  id: "prov_dr_avery",
  name: "Dr. Emily Avery",
  role: "DENTIST" as const,
  avatarUrl: undefined,
};

/**
 * Hygienist portal identity — same placeholder pattern as `currentProvider`.
 * Id matches `prov_hyg_reyes` in `practiceProviders` below so cross-portal
 * data (e.g. the Receptionist's practice-wide schedule) attributes the same
 * appointments to the same hygienist as this portal does.
 */
export const currentHygienist = {
  id: "prov_hyg_reyes",
  name: "Dana Reyes, RDH",
  role: "HYGIENIST" as const,
  avatarUrl: undefined,
};

export const patients: SamplePatient[] = [
  {
    id: "pat_sarah_johnson",
    firstName: "Sarah",
    lastName: "Johnson",
    dateOfBirth: "1990-04-12",
    sex: "FEMALE",
    phone: "(555) 201-4488",
    email: "sarah.johnson@example.com",
    insuranceProvider: "Delta Dental",
    insurancePlan: "PPO Plus",
    balanceCents: 12000,
    medicalAlerts: ["Penicillin allergy", "Sensitive gums"],
    lastCleaningAt: "2026-05-14",
    recallStatus: "Due in 2 weeks",
    nextApptAt: "2026-08-27T14:00:00.000Z",
    status: "Active",
  },
  {
    id: "pat_james_carter",
    firstName: "James",
    lastName: "Carter",
    dateOfBirth: "1985-11-02",
    sex: "MALE",
    phone: "(555) 340-9021",
    email: "james.carter@example.com",
    insuranceProvider: "Cigna",
    insurancePlan: "Dental Care 500",
    balanceCents: 0,
    medicalAlerts: [],
    lastCleaningAt: "2026-07-02",
    recallStatus: "On track",
    nextApptAt: "2026-08-26T09:30:00.000Z",
    status: "Active",
  },
  {
    id: "pat_olivia_martinez",
    firstName: "Olivia",
    lastName: "Martinez",
    dateOfBirth: "2001-02-19",
    sex: "FEMALE",
    phone: "(555) 118-7742",
    email: "olivia.martinez@example.com",
    insuranceProvider: "MetLife",
    insurancePlan: "Essential",
    balanceCents: 4500,
    medicalAlerts: ["Latex allergy"],
    lastCleaningAt: "2026-03-21",
    recallStatus: "Overdue",
    nextApptAt: null,
    status: "Active",
  },
  {
    id: "pat_ethan_walker",
    firstName: "Ethan",
    lastName: "Walker",
    dateOfBirth: "1978-06-30",
    sex: "MALE",
    phone: "(555) 902-3315",
    email: "ethan.walker@example.com",
    insuranceProvider: "Aetna",
    insurancePlan: "PPO",
    balanceCents: 32000,
    medicalAlerts: ["Diabetic"],
    lastCleaningAt: "2026-01-09",
    recallStatus: "Overdue",
    nextApptAt: "2026-08-28T11:00:00.000Z",
    status: "Active",
  },
  {
    id: "pat_michael_lee",
    firstName: "Michael",
    lastName: "Lee",
    dateOfBirth: "1995-09-08",
    sex: "MALE",
    phone: "(555) 774-6620",
    email: "michael.lee@example.com",
    insuranceProvider: "Guardian",
    insurancePlan: "Signature",
    balanceCents: 0,
    medicalAlerts: [],
    lastCleaningAt: "2026-06-18",
    recallStatus: "On track",
    nextApptAt: "2026-08-25T15:30:00.000Z",
    status: "Active",
  },
  {
    id: "pat_emma_williams",
    firstName: "Emma",
    lastName: "Williams",
    dateOfBirth: "1988-12-24",
    sex: "FEMALE",
    phone: "(555) 556-1290",
    email: "emma.williams@example.com",
    insuranceProvider: "Delta Dental",
    insurancePlan: "PPO Plus",
    balanceCents: 8800,
    medicalAlerts: ["Sensitive gums"],
    lastCleaningAt: "2026-04-30",
    recallStatus: "Due in 3 weeks",
    nextApptAt: "2026-08-31T10:00:00.000Z",
    status: "Active",
  },
  {
    id: "pat_daniel_brooks",
    firstName: "Daniel",
    lastName: "Brooks",
    dateOfBirth: "1972-03-15",
    sex: "MALE",
    phone: "(555) 683-2201",
    email: "daniel.brooks@example.com",
    insuranceProvider: "Cigna",
    insurancePlan: "Dental Care 500",
    balanceCents: 15000,
    medicalAlerts: [],
    lastCleaningAt: "2025-12-11",
    recallStatus: "Overdue",
    nextApptAt: null,
    status: "Inactive",
  },
  {
    id: "pat_ava_nguyen",
    firstName: "Ava",
    lastName: "Nguyen",
    dateOfBirth: "1999-07-21",
    sex: "FEMALE",
    phone: "(555) 447-8813",
    email: "ava.nguyen@example.com",
    insuranceProvider: "MetLife",
    insurancePlan: "Essential",
    balanceCents: 0,
    medicalAlerts: ["Penicillin allergy"],
    lastCleaningAt: "2026-07-25",
    recallStatus: "On track",
    nextApptAt: "2026-08-26T13:00:00.000Z",
    status: "Active",
  },
];

export function getPatientById(id: string) {
  return patients.find((p) => p.id === id) ?? null;
}

export function patientFullName(p: SamplePatient) {
  return `${p.firstName} ${p.lastName}`;
}

export function patientAge(p: SamplePatient) {
  const dob = new Date(p.dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

// ---------------------------------------------------------------------------
// Appointments — spread across "this week" relative to a fixed reference date
// so the weekly chart / today's ring / schedule views all agree with each
// other. Reference "today" is 2026-08-24 (a Monday) to match project dates.
// ---------------------------------------------------------------------------

export const appointments: SampleAppointment[] = [
  {
    id: "appt_1",
    patientId: "pat_michael_lee",
    providerId: currentProvider.id,
    providerName: currentProvider.name,
    procedureType: "Routine Cleaning",
    status: "CONFIRMED",
    startTime: "2026-08-24T13:00:00.000Z",
    endTime: "2026-08-24T13:45:00.000Z",
  },
  {
    id: "appt_2",
    patientId: "pat_ava_nguyen",
    providerId: currentProvider.id,
    providerName: currentProvider.name,
    procedureType: "Consultation",
    status: "SCHEDULED",
    startTime: "2026-08-24T15:15:00.000Z",
    endTime: "2026-08-24T15:45:00.000Z",
  },
  {
    id: "appt_3",
    patientId: "pat_james_carter",
    providerId: currentProvider.id,
    providerName: currentProvider.name,
    procedureType: "Crown Fitting",
    status: "CONFIRMED",
    startTime: "2026-08-25T09:30:00.000Z",
    endTime: "2026-08-25T10:30:00.000Z",
  },
  {
    id: "appt_4",
    patientId: "pat_sarah_johnson",
    providerId: currentProvider.id,
    providerName: currentProvider.name,
    procedureType: "Root Canal Follow-up",
    status: "SCHEDULED",
    startTime: "2026-08-27T14:00:00.000Z",
    endTime: "2026-08-27T15:00:00.000Z",
  },
  {
    id: "appt_5",
    patientId: "pat_ethan_walker",
    providerId: currentProvider.id,
    providerName: currentProvider.name,
    procedureType: "Filling",
    status: "SCHEDULED",
    startTime: "2026-08-28T11:00:00.000Z",
    endTime: "2026-08-28T11:45:00.000Z",
  },
  {
    id: "appt_6",
    patientId: "pat_emma_williams",
    providerId: currentProvider.id,
    providerName: currentProvider.name,
    procedureType: "Whitening",
    status: "SCHEDULED",
    startTime: "2026-08-31T10:00:00.000Z",
    endTime: "2026-08-31T11:00:00.000Z",
  },
  {
    id: "appt_7",
    patientId: "pat_olivia_martinez",
    providerId: currentProvider.id,
    providerName: currentProvider.name,
    procedureType: "Cleaning",
    status: "COMPLETED",
    startTime: "2026-08-20T14:00:00.000Z",
    endTime: "2026-08-20T14:45:00.000Z",
  },
  {
    id: "appt_8",
    patientId: "pat_daniel_brooks",
    providerId: currentProvider.id,
    providerName: currentProvider.name,
    procedureType: "Extraction",
    status: "CANCELLED",
    startTime: "2026-08-21T09:00:00.000Z",
    endTime: "2026-08-21T09:45:00.000Z",
  },
];

/** Weekly visit counts, Mon–Sun, for the dashboard bar chart. */
export function weeklyVisitCounts(): { day: string; count: number }[] {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const counts = [4, 6, 3, 7, 5, 2, 0];
  return days.map((day, i) => ({ day, count: counts[i] }));
}

export function todaysAppointments() {
  const today = "2026-08-24";
  return appointments.filter((a) => a.startTime.startsWith(today));
}

// ---------------------------------------------------------------------------
// Treatment plan + perio chart
// ---------------------------------------------------------------------------

export const treatmentPlanItems: SampleTreatmentPlanItem[] = [
  {
    id: "tpi_1",
    patientId: "pat_sarah_johnson",
    tooth: "#14",
    quadrant: "Upper Left",
    procedure: "Composite Filling",
    status: "PLANNED",
    recallInterval: "6 months",
  },
  {
    id: "tpi_2",
    patientId: "pat_sarah_johnson",
    tooth: "#3",
    quadrant: "Upper Right",
    procedure: "Crown",
    status: "ACTIVE",
    recallInterval: "3 months",
  },
  {
    id: "tpi_3",
    patientId: "pat_sarah_johnson",
    tooth: "#19",
    quadrant: "Lower Left",
    procedure: "Root Canal",
    status: "COMPLETED",
    recallInterval: "12 months",
  },
  {
    id: "tpi_4",
    patientId: "pat_james_carter",
    tooth: "#8",
    quadrant: "Upper Anterior",
    procedure: "Veneer",
    status: "PLANNED",
    recallInterval: "6 months",
  },
  {
    id: "tpi_5",
    patientId: "pat_ethan_walker",
    tooth: "#30",
    quadrant: "Lower Right",
    procedure: "Extraction",
    status: "DECLINED",
    recallInterval: "N/A",
  },
];

export function treatmentPlanForPatient(patientId: string) {
  return treatmentPlanItems.filter((t) => t.patientId === patientId);
}

export const perioChartEntries: SamplePerioChartEntry[] = [
  { patientId: "pat_sarah_johnson", chartedAt: "2026-05-14", avgPocketDepthMm: 2.8, bleedingPercent: 9 },
  { patientId: "pat_james_carter", chartedAt: "2026-07-02", avgPocketDepthMm: 2.3, bleedingPercent: 4 },
  { patientId: "pat_olivia_martinez", chartedAt: "2026-03-21", avgPocketDepthMm: 3.4, bleedingPercent: 18 },
  { patientId: "pat_ethan_walker", chartedAt: "2026-01-09", avgPocketDepthMm: 4.1, bleedingPercent: 27 },
  { patientId: "pat_michael_lee", chartedAt: "2026-06-18", avgPocketDepthMm: 2.1, bleedingPercent: 3 },
  { patientId: "pat_emma_williams", chartedAt: "2026-04-30", avgPocketDepthMm: 2.6, bleedingPercent: 8 },
];

export function perioChartForPatient(patientId: string) {
  return perioChartEntries.find((p) => p.patientId === patientId) ?? null;
}

// ---------------------------------------------------------------------------
// Billing
// ---------------------------------------------------------------------------

export const invoices: SampleInvoice[] = [
  {
    id: "inv_1001",
    invoiceNumber: "INV-1001",
    patientId: "pat_sarah_johnson",
    status: "PAID",
    issuedAt: "2026-08-01",
    dueAt: "2026-08-15",
    lineItems: [
      { id: "li_1", description: "Comprehensive Exam", procedureCode: "D0150", quantity: 1, unitPriceCents: 12000 },
      { id: "li_2", description: "Bitewing X-Rays", procedureCode: "D0274", quantity: 1, unitPriceCents: 6500 },
    ],
  },
  {
    id: "inv_1002",
    invoiceNumber: "INV-1002",
    patientId: "pat_james_carter",
    status: "PENDING",
    issuedAt: "2026-08-10",
    dueAt: "2026-09-01",
    lineItems: [
      { id: "li_3", description: "Porcelain Crown", procedureCode: "D2740", quantity: 1, unitPriceCents: 95000 },
    ],
  },
  {
    id: "inv_1003",
    invoiceNumber: "INV-1003",
    patientId: "pat_olivia_martinez",
    status: "OVERDUE",
    issuedAt: "2026-07-05",
    dueAt: "2026-07-20",
    lineItems: [
      { id: "li_4", description: "Routine Cleaning", procedureCode: "D1110", quantity: 1, unitPriceCents: 9500 },
      { id: "li_5", description: "Fluoride Treatment", procedureCode: "D1206", quantity: 1, unitPriceCents: 4000 },
    ],
  },
  {
    id: "inv_1004",
    invoiceNumber: "INV-1004",
    patientId: "pat_ethan_walker",
    status: "OVERDUE",
    issuedAt: "2026-06-28",
    dueAt: "2026-07-12",
    lineItems: [
      { id: "li_6", description: "Tooth Extraction", procedureCode: "D7140", quantity: 1, unitPriceCents: 22000 },
      { id: "li_7", description: "Post-Op Follow-up", procedureCode: "D9430", quantity: 1, unitPriceCents: 10000 },
    ],
  },
  {
    id: "inv_1005",
    invoiceNumber: "INV-1005",
    patientId: "pat_michael_lee",
    status: "PAID",
    issuedAt: "2026-08-12",
    dueAt: "2026-08-26",
    lineItems: [
      { id: "li_8", description: "Routine Cleaning", procedureCode: "D1110", quantity: 1, unitPriceCents: 9500 },
    ],
  },
  {
    id: "inv_1006",
    invoiceNumber: "INV-1006",
    patientId: "pat_emma_williams",
    status: "PENDING",
    issuedAt: "2026-08-18",
    dueAt: "2026-09-05",
    lineItems: [
      { id: "li_9", description: "Teeth Whitening", procedureCode: "D9972", quantity: 1, unitPriceCents: 35000 },
    ],
  },
  {
    id: "inv_1007",
    invoiceNumber: "INV-1007",
    patientId: "pat_daniel_brooks",
    status: "OVERDUE",
    issuedAt: "2026-06-01",
    dueAt: "2026-06-15",
    lineItems: [
      { id: "li_10", description: "Deep Cleaning (per quadrant)", procedureCode: "D4341", quantity: 2, unitPriceCents: 18000 },
    ],
  },
  {
    id: "inv_1008",
    invoiceNumber: "INV-1008",
    patientId: "pat_ava_nguyen",
    status: "PAID",
    issuedAt: "2026-08-05",
    dueAt: "2026-08-19",
    lineItems: [
      { id: "li_11", description: "Comprehensive Exam", procedureCode: "D0150", quantity: 1, unitPriceCents: 12000 },
    ],
  },
];

export function invoiceTotalCents(invoice: SampleInvoice) {
  return invoice.lineItems.reduce((sum, li) => sum + li.quantity * li.unitPriceCents, 0);
}

export function getInvoiceById(id: string) {
  return invoices.find((i) => i.id === id) ?? null;
}

export function formatCentsAsCurrency(cents: number) {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

/**
 * Billing KPIs derived entirely from the sample invoices, so the dashboard
 * cards always reconcile: totalRevenue = collected + outstanding, and
 * overdue is a subset of outstanding (never larger than it).
 */
export function billingSummary() {
  const collected = invoices
    .filter((i) => i.status === "PAID")
    .reduce((sum, i) => sum + invoiceTotalCents(i), 0);
  const outstanding = invoices
    .filter((i) => i.status === "PENDING" || i.status === "OVERDUE")
    .reduce((sum, i) => sum + invoiceTotalCents(i), 0);
  const overdue = invoices
    .filter((i) => i.status === "OVERDUE")
    .reduce((sum, i) => sum + invoiceTotalCents(i), 0);
  // Total revenue = all billed invoices (paid + still outstanding), so this
  // card is always >= both Collected and Overdue, never equal to Collected
  // alone while Overdue is larger.
  const totalRevenue = collected + outstanding;
  const collectionRate =
    totalRevenue > 0 ? Math.round((collected / totalRevenue) * 100) : 0;

  return { totalRevenue, outstanding, overdue, collected, collectionRate };
}

/** Six-month cashflow trend for the billing dashboard chart. */
export function cashflowTrend(): { month: string; collected: number; billed: number }[] {
  return [
    { month: "Mar", collected: 18200, billed: 21000 },
    { month: "Apr", collected: 21500, billed: 24000 },
    { month: "May", collected: 19800, billed: 23500 },
    { month: "Jun", collected: 24100, billed: 26000 },
    { month: "Jul", collected: 22700, billed: 25500 },
    { month: "Aug", collected: 26300, billed: 28000 },
  ];
}

/** Outstanding balance grouped by age bucket, for the billing dashboard. */
export function outstandingByAge(): { bucket: string; amountCents: number }[] {
  return [
    { bucket: "0-30 days", amountCents: 45000 },
    { bucket: "31-60 days", amountCents: 32000 },
    { bucket: "61-90 days", amountCents: 21000 },
    { bucket: "90+ days", amountCents: 15000 },
  ];
}

// ---------------------------------------------------------------------------
// Follow-ups + "open time / ASAP" waitlist for My Schedule
// ---------------------------------------------------------------------------

export const followUps = [
  { patientId: "pat_olivia_martinez", reason: "Recall cleaning overdue" },
  { patientId: "pat_ethan_walker", reason: "Post-extraction check-in" },
  { patientId: "pat_daniel_brooks", reason: "Outstanding balance reminder" },
];

export const scheduleWaitlist = [
  { patientId: "pat_ava_nguyen", reason: "Open time / ASAP", requestedProcedure: "Cleaning" },
  { patientId: "pat_daniel_brooks", reason: "Open time / ASAP", requestedProcedure: "Deep Cleaning" },
];

// ---------------------------------------------------------------------------
// Hygienist patient messaging — conversations + threaded messages backing the
// Hygienist portal's Messages screen. Participants are drawn from the same
// `patients` roster above (no parallel patient list). Messages are plain
// seed data; sending a new message in the UI only updates local React state,
// there is no persistence layer yet.
// ---------------------------------------------------------------------------

export type MessageSender = "PROVIDER" | "PATIENT";

export interface SampleMessage {
  id: string;
  conversationId: string;
  sender: MessageSender;
  body: string;
  sentAt: string; // ISO datetime
}

export interface SampleConversation {
  id: string;
  patientId: string;
  unreadCount: number;
}

export const conversations: SampleConversation[] = [
  { id: "conv_sarah_johnson", patientId: "pat_sarah_johnson", unreadCount: 1 },
  { id: "conv_olivia_martinez", patientId: "pat_olivia_martinez", unreadCount: 2 },
  { id: "conv_ethan_walker", patientId: "pat_ethan_walker", unreadCount: 0 },
  { id: "conv_michael_lee", patientId: "pat_michael_lee", unreadCount: 0 },
  { id: "conv_emma_williams", patientId: "pat_emma_williams", unreadCount: 1 },
];

const sampleMessages: SampleMessage[] = [
  // Sarah Johnson
  {
    id: "msg_sj_1",
    conversationId: "conv_sarah_johnson",
    sender: "PROVIDER",
    body: "Hi Sarah, just confirming your cleaning is booked for Aug 27 at 2:00 PM. See you then!",
    sentAt: "2026-08-22T15:05:00.000Z",
  },
  {
    id: "msg_sj_2",
    conversationId: "conv_sarah_johnson",
    sender: "PATIENT",
    body: "Thanks for the reminder — I'll be there. Should I keep taking the sensitivity toothpaste?",
    sentAt: "2026-08-23T13:40:00.000Z",
  },
  {
    id: "msg_sj_3",
    conversationId: "conv_sarah_johnson",
    sender: "PATIENT",
    body: "Also wanted to ask if the appointment will run long — I have a meeting right after.",
    sentAt: "2026-08-24T09:12:00.000Z",
  },
  // Olivia Martinez (overdue recall)
  {
    id: "msg_om_1",
    conversationId: "conv_olivia_martinez",
    sender: "PROVIDER",
    body: "Hi Olivia, our records show your recall cleaning is overdue. Do you have a few minutes to pick a time this week?",
    sentAt: "2026-08-20T16:00:00.000Z",
  },
  {
    id: "msg_om_2",
    conversationId: "conv_olivia_martinez",
    sender: "PATIENT",
    body: "Sorry for the delay, things have been hectic. Can you send me some openings?",
    sentAt: "2026-08-23T11:22:00.000Z",
  },
  {
    id: "msg_om_3",
    conversationId: "conv_olivia_martinez",
    sender: "PATIENT",
    body: "Also — is there a cancellation list I can join in case something opens up sooner?",
    sentAt: "2026-08-23T11:24:00.000Z",
  },
  // Ethan Walker (overdue recall)
  {
    id: "msg_ew_1",
    conversationId: "conv_ethan_walker",
    sender: "PROVIDER",
    body: "Hi Ethan, checking in after your extraction — how is the healing going?",
    sentAt: "2026-08-21T14:00:00.000Z",
  },
  {
    id: "msg_ew_2",
    conversationId: "conv_ethan_walker",
    sender: "PATIENT",
    body: "Healing well, thank you. Some mild soreness but nothing concerning.",
    sentAt: "2026-08-21T18:30:00.000Z",
  },
  // Michael Lee
  {
    id: "msg_ml_1",
    conversationId: "conv_michael_lee",
    sender: "PATIENT",
    body: "Quick question — does my plan cover fluoride treatment at tomorrow's visit?",
    sentAt: "2026-08-23T20:10:00.000Z",
  },
  {
    id: "msg_ml_2",
    conversationId: "conv_michael_lee",
    sender: "PROVIDER",
    body: "Yes, fluoride treatment is covered under your plan. See you tomorrow at 3:30 PM.",
    sentAt: "2026-08-23T20:45:00.000Z",
  },
  // Emma Williams
  {
    id: "msg_ewi_1",
    conversationId: "conv_emma_williams",
    sender: "PROVIDER",
    body: "Hi Emma, your whitening appointment is confirmed for Aug 31 at 10:00 AM.",
    sentAt: "2026-08-22T10:00:00.000Z",
  },
  {
    id: "msg_ewi_2",
    conversationId: "conv_emma_williams",
    sender: "PATIENT",
    body: "Great, thank you! Should I avoid coffee beforehand?",
    sentAt: "2026-08-24T08:15:00.000Z",
  },
];

/** Messages for a single conversation, oldest first. */
export function messagesForConversation(conversationId: string): SampleMessage[] {
  return sampleMessages
    .filter((m) => m.conversationId === conversationId)
    .sort((a, b) => a.sentAt.localeCompare(b.sentAt));
}

/** Most recent message in a conversation, for the conversation-list preview. */
export function lastMessageForConversation(conversationId: string): SampleMessage | null {
  const thread = messagesForConversation(conversationId);
  return thread.length > 0 ? thread[thread.length - 1] : null;
}

export function getConversationById(id: string) {
  return conversations.find((c) => c.id === id) ?? null;
}

/** Conversation for a given patient, if one already exists. */
export function conversationForPatient(patientId: string) {
  return conversations.find((c) => c.patientId === patientId) ?? null;
}

// ---------------------------------------------------------------------------
// Practice-wide providers + front-desk appointments — additive section for
// the Receptionist portal, which (unlike Dentist/Hygienist) coordinates
// across every provider in the practice rather than a single provider's own
// schedule. `practiceAppointments` layers a few additional appointments
// under other providers on top of the existing `appointments` array so the
// practice-wide schedule view has more than one provider's worth of data.
// ---------------------------------------------------------------------------

export interface SampleProvider {
  id: string;
  name: string;
  role: "DENTIST" | "HYGIENIST";
}

export const practiceProviders: SampleProvider[] = [
  { id: currentProvider.id, name: currentProvider.name, role: "DENTIST" },
  { id: "prov_dr_kim", name: "Dr. Raj Kapoor", role: "DENTIST" },
  { id: currentHygienist.id, name: currentHygienist.name, role: "HYGIENIST" },
];

const additionalPracticeAppointments: SampleAppointment[] = [
  {
    id: "appt_rc_1",
    patientId: "pat_emma_williams",
    providerId: "prov_dr_kim",
    providerName: "Dr. Raj Kapoor",
    procedureType: "New Patient Exam",
    status: "CHECKED_IN",
    startTime: "2026-08-24T14:30:00.000Z",
    endTime: "2026-08-24T15:15:00.000Z",
  },
  {
    id: "appt_rc_2",
    patientId: "pat_daniel_brooks",
    providerId: currentHygienist.id,
    providerName: currentHygienist.name,
    procedureType: "Periodontal Maintenance",
    status: "NO_SHOW",
    startTime: "2026-08-24T11:00:00.000Z",
    endTime: "2026-08-24T11:45:00.000Z",
  },
  {
    id: "appt_rc_3",
    patientId: "pat_olivia_martinez",
    providerId: currentHygienist.id,
    providerName: currentHygienist.name,
    procedureType: "Cleaning",
    status: "CHECKED_IN",
    startTime: "2026-08-24T10:00:00.000Z",
    endTime: "2026-08-24T10:45:00.000Z",
  },
  {
    id: "appt_rc_4",
    patientId: "pat_ava_nguyen",
    providerId: "prov_dr_kim",
    providerName: "Dr. Raj Kapoor",
    procedureType: "Filling",
    status: "SCHEDULED",
    startTime: "2026-08-25T13:00:00.000Z",
    endTime: "2026-08-25T13:45:00.000Z",
  },
];

/** Every appointment across every provider in the practice, for the Receptionist portal's schedule. */
export function practiceAppointments() {
  return [...appointments, ...additionalPracticeAppointments];
}

export function todaysPracticeAppointments() {
  const today = "2026-08-24";
  return practiceAppointments().filter((a) => a.startTime.startsWith(today));
}

// ---------------------------------------------------------------------------
// Patient portal identity — same placeholder pattern as `currentProvider` /
// `currentHygienist`. There is no patient-facing auth yet, so the whole
// Patient portal is hardcoded to a single signed-in patient (Sarah Johnson,
// `pat_sarah_johnson`, already present in `patients` above) rather than
// reading a session. A follow-up phase will resolve this from a real
// patient login instead of a constant.
// ---------------------------------------------------------------------------

export const currentPatient: SamplePatient = patients.find(
  (p) => p.id === "pat_sarah_johnson",
)!;

/**
 * Synthetic open appointment slots for the Patient portal's booking flow.
 * Not real scheduling/availability logic — just a small, plausible list of
 * near-future weekday slots that don't collide with any existing entries in
 * `appointments`, so the booking UI has something concrete to offer. A real
 * implementation would query provider availability against the practice
 * calendar.
 */
export interface SampleOpenSlot {
  id: string;
  startTime: string; // ISO datetime
  endTime: string;
  providerName: string;
}

export const openAppointmentSlots: SampleOpenSlot[] = [
  { id: "slot_1", startTime: "2026-08-25T16:00:00.000Z", endTime: "2026-08-25T16:30:00.000Z", providerName: currentProvider.name },
  { id: "slot_2", startTime: "2026-08-26T15:30:00.000Z", endTime: "2026-08-26T16:00:00.000Z", providerName: currentProvider.name },
  { id: "slot_3", startTime: "2026-08-27T17:00:00.000Z", endTime: "2026-08-27T17:30:00.000Z", providerName: currentProvider.name },
  { id: "slot_4", startTime: "2026-08-28T14:30:00.000Z", endTime: "2026-08-28T15:00:00.000Z", providerName: currentProvider.name },
  { id: "slot_5", startTime: "2026-09-01T16:30:00.000Z", endTime: "2026-09-01T17:00:00.000Z", providerName: currentProvider.name },
];

/** Booking reasons offered in the Patient portal's "request an appointment" flow. */
export const bookingReasons = [
  "Routine Cleaning",
  "Consultation",
  "Follow-up",
  "Tooth Pain / Urgent",
] as const;

/**
 * Sample prescriptions shown on the Patient portal's "My Care" page.
 * Clearly fictional placeholder content tied to Sarah Johnson's treatment
 * plan (the completed root canal + active crown) — not real medical advice
 * or a real e-prescribing integration.
 */
export interface SamplePrescription {
  id: string;
  patientId: string;
  medication: string;
  instructions: string;
  prescribedAt: string; // ISO date
  prescribedBy: string;
}

export const prescriptions: SamplePrescription[] = [
  {
    id: "rx_1",
    patientId: "pat_sarah_johnson",
    medication: "Amoxicillin 500mg (sample)",
    instructions: "One capsule three times daily for 7 days, with food.",
    prescribedAt: "2026-07-30",
    prescribedBy: currentProvider.name,
  },
  {
    id: "rx_2",
    patientId: "pat_sarah_johnson",
    medication: "Ibuprofen 400mg (sample)",
    instructions: "One tablet every 6 hours as needed for discomfort, max 3 per day.",
    prescribedAt: "2026-08-01",
    prescribedBy: currentProvider.name,
  },
];

export function prescriptionsForPatient(patientId: string) {
  return prescriptions.filter((rx) => rx.patientId === patientId);
}

/**
 * Forms-to-sign for the Patient portal's e-sign section. Purely a UI
 * placeholder — "signing" only flips local component state, there's no real
 * document renderer or e-signature provider wired up yet.
 */
export interface SampleConsentForm {
  id: string;
  patientId: string;
  title: string;
  description: string;
}

export const consentForms: SampleConsentForm[] = [
  {
    id: "form_1",
    patientId: "pat_sarah_johnson",
    title: "Crown Procedure Consent",
    description: "Standard consent for the planned crown placement on tooth #3.",
  },
  {
    id: "form_2",
    patientId: "pat_sarah_johnson",
    title: "Financial Responsibility Agreement",
    description: "Acknowledgement of estimated out-of-pocket cost and payment terms.",
  },
];

export function consentFormsForPatient(patientId: string) {
  return consentForms.filter((f) => f.patientId === patientId);
}

/**
 * Alternate providers offered in the Patient portal's "switch dentist" UI
 * affordance. Reuses `practiceProviders` where possible; "Request switch" is
 * a UI-only confirmation state, no real reassignment happens.
 */
export const alternateProviders: SampleProvider[] = practiceProviders.filter(
  (p) => p.id !== currentProvider.id,
);
