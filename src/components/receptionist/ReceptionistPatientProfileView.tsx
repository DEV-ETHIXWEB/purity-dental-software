"use client";

import Link from "next/link";
import { CalendarX2, FileX2, UserX } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { ContactDetailsCard } from "@/components/dentist/ContactDetailsCard";
import { BillingDetailsCard } from "@/components/dentist/BillingDetailsCard";
import { InvoiceStatusBadge } from "@/components/dentist/InvoiceStatusBadge";
import { RecallStatusBadge } from "@/components/dentist/PatientStatusBadge";
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from "@/components/ui/Table";
import {
  patientFullName,
  patientAge,
  appointments,
  invoices,
  invoiceTotalCents,
  formatCentsAsCurrency,
  type AppointmentStatus,
} from "@/lib/sample-data";
import { useFindPatientById } from "@/lib/receptionist-patients-store";
import { type BadgeTone } from "@/components/ui/Badge";

const STATUS_TONE: Record<AppointmentStatus, BadgeTone> = {
  SCHEDULED: "info",
  CONFIRMED: "brand-blue",
  CHECKED_IN: "brand-teal",
  IN_PROGRESS: "warning",
  COMPLETED: "success",
  CANCELLED: "neutral",
  NO_SHOW: "error",
};

export function ReceptionistPatientProfileView({ patientId }: { patientId: string }) {
  const patient = useFindPatientById(patientId);

  if (!patient) {
    // Session-registered patients only exist in this browser tab's memory
    // (see `receptionist-patients-store.ts`) — a hard refresh or a different
    // tab won't find them since there's no backend yet. Render an in-page
    // empty state rather than a hard 404 so the "why" is clear.
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-xl)] border border-dashed border-border-strong bg-surface py-16 text-center">
        <UserX className="h-8 w-8 text-text-secondary" aria-hidden="true" />
        <div>
          <p className="text-sm font-medium text-text-primary">Patient not found</p>
          <p className="mx-auto max-w-sm text-xs text-text-secondary">
            This patient record isn&apos;t available. If they were just registered, this can happen
            after a page refresh since registration isn&apos;t saved to a database yet.
          </p>
        </div>
        <Link
          href="/receptionist/patients"
          className="mt-2 inline-flex h-10 items-center rounded-[var(--radius-lg)] border border-border bg-transparent px-4 text-sm font-medium text-text-primary transition-colors hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
        >
          Back to Patients
        </Link>
      </div>
    );
  }

  const name = patientFullName(patient);
  const patientAppointments = appointments
    .filter((a) => a.patientId === patient.id)
    .sort((a, b) => b.startTime.localeCompare(a.startTime));
  const patientInvoices = invoices
    .filter((i) => i.patientId === patient.id)
    .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-[var(--radius-xl)] border border-border bg-surface p-5 shadow-card sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={name} src={patient.photoUrl} size="lg" />
          <div>
            <h1 className="text-xl font-semibold text-text-primary">{name}</h1>
            <p className="text-sm text-text-secondary">
              {new Date(patient.dateOfBirth).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}{" "}
              ({patientAge(patient)} yrs) ·{" "}
              {patient.sex === "MALE" ? "Male" : patient.sex === "FEMALE" ? "Female" : "Other"}
            </p>
            <div className="mt-2">
              <RecallStatusBadge status={patient.recallStatus} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-1">
          <ContactDetailsCard patient={patient} />

          <Card>
            <CardHeader>
              <CardTitle>Medical Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              {patient.medicalAlerts.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {patient.medicalAlerts.map((alert) => (
                    <Badge key={alert} tone="error">
                      {alert}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-secondary">No known alerts on file.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardContent>
              <Tabs defaultValue="overview">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="appointments">Appointments</TabsTrigger>
                  <TabsTrigger value="billing">Billing</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                  <BillingDetailsCard patient={patient} />
                </TabsContent>

                <TabsContent value="appointments">
                  {patientAppointments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-border-strong py-12 text-center">
                      <CalendarX2 className="h-8 w-8 text-text-secondary" aria-hidden="true" />
                      <p className="text-sm font-medium text-text-primary">No appointment history</p>
                      <p className="max-w-xs text-xs text-text-secondary">
                        {name}&apos;s visits will appear here once appointments are booked.
                      </p>
                    </div>
                  ) : (
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableHeaderCell>Date</TableHeaderCell>
                            <TableHeaderCell>Provider</TableHeaderCell>
                            <TableHeaderCell>Procedure</TableHeaderCell>
                            <TableHeaderCell>Status</TableHeaderCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {patientAppointments.map((appt) => (
                            <TableRow key={appt.id}>
                              <TableCell className="text-text-secondary">
                                {new Date(appt.startTime).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </TableCell>
                              <TableCell className="text-text-primary">{appt.providerName}</TableCell>
                              <TableCell className="text-text-primary">{appt.procedureType}</TableCell>
                              <TableCell>
                                <Badge tone={STATUS_TONE[appt.status]}>
                                  {appt.status.replace("_", " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </TabsContent>

                <TabsContent value="billing">
                  {patientInvoices.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-border-strong py-12 text-center">
                      <FileX2 className="h-8 w-8 text-text-secondary" aria-hidden="true" />
                      <p className="text-sm font-medium text-text-primary">No invoices on file</p>
                      <p className="max-w-xs text-xs text-text-secondary">
                        Invoices for {name} will appear here once they&apos;re billed.
                      </p>
                    </div>
                  ) : (
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableHeaderCell>Invoice</TableHeaderCell>
                            <TableHeaderCell>Date</TableHeaderCell>
                            <TableHeaderCell>Amount</TableHeaderCell>
                            <TableHeaderCell>Status</TableHeaderCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {patientInvoices.map((invoice) => (
                            <TableRow key={invoice.id}>
                              <TableCell className="font-medium text-text-primary">
                                {invoice.invoiceNumber}
                              </TableCell>
                              <TableCell className="text-text-secondary">
                                {new Date(invoice.issuedAt).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </TableCell>
                              <TableCell className="font-medium text-text-primary">
                                {formatCentsAsCurrency(invoiceTotalCents(invoice))}
                              </TableCell>
                              <TableCell>
                                <InvoiceStatusBadge status={invoice.status} />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
