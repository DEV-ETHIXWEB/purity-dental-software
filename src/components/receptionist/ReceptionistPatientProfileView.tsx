"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Check, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { CalendarIconFilled, BillingIconFilled } from "@/components/ui/icons/purity-icons";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
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
import { patientFullName, patientAge } from "@/lib/patient-format";
import { formatCentsAsCurrency, invoiceNumber } from "@/lib/billing-format";
import { updatePatientDemographics } from "@/lib/actions/update-patient";
import type { InvoiceWithDetails } from "@/lib/data/billing";
import type { AppointmentWithPatientAndProvider } from "@/lib/data/appointments";
import type { Patient, AppointmentStatus } from "@/generated/prisma/client";
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

export interface ReceptionistPatientProfileViewProps {
  patient: Patient;
  appointments: AppointmentWithPatientAndProvider[];
  invoices: InvoiceWithDetails[];
}

export function ReceptionistPatientProfileView({
  patient,
  appointments,
  invoices,
}: ReceptionistPatientProfileViewProps) {
  const router = useRouter();
  const name = patientFullName(patient);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState(patient.firstName);
  const [lastName, setLastName] = useState(patient.lastName);
  const [phone, setPhone] = useState(patient.phone ?? "");

  function cancelEdit() {
    setFirstName(patient.firstName);
    setLastName(patient.lastName);
    setPhone(patient.phone ?? "");
    setError(null);
    setEditing(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const result = await updatePatientDemographics(patient.id, { firstName, lastName, phone });
    setSaving(false);
    if (result.ok) {
      setEditing(false);
      router.refresh();
    } else {
      setError(result.error ?? "Couldn't save demographics. Please try again.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-[var(--radius-xl)] border border-border bg-surface p-5 shadow-card sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-1 items-start gap-4">
          <Avatar name={name} src={patient.photoUrl} size="lg" />
          <div className="flex-1">
            {editing ? (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input label="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                  <Input label="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  <Input label="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                {error && (
                  <p role="alert" className="text-sm text-error">
                    {error}
                  </p>
                )}
              </div>
            ) : (
              <>
                <h1 className="text-xl font-semibold text-text-primary">{name}</h1>
                <p className="text-sm text-text-secondary">
                  {patient.dateOfBirth.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}{" "}
                  ({patientAge(patient)} yrs) ·{" "}
                  {patient.sex === "MALE" ? "Male" : patient.sex === "FEMALE" ? "Female" : "Other"}
                </p>
              </>
            )}
            <div className="mt-2">
              <RecallStatusBadge status={patient.recallStatus} />
            </div>
          </div>
        </div>
        {!editing ? (
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)} aria-label="Edit demographics">
            <Pencil className="h-4 w-4" aria-hidden="true" />
            Edit
          </Button>
        ) : (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSave}
              disabled={saving}
              aria-label="Save demographics"
            >
              <Check className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={cancelEdit}
              disabled={saving}
              aria-label="Cancel editing demographics"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card className="divide-y divide-border">
            <ContactDetailsCard patient={patient} canEdit />
            <section className="p-4">
              <h3 className="text-[15px] font-semibold tracking-tight text-text-primary">Medical Alerts</h3>
              <div className="mt-3">
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
              </div>
            </section>
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
                  <BillingDetailsCard patient={patient} canEdit />
                </TabsContent>

                <TabsContent value="appointments">
                  {appointments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-border-strong py-12 text-center">
                      <CalendarIconFilled className="h-8 w-8" aria-hidden="true" />
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
                          {appointments.map((appt) => (
                            <TableRow key={appt.id}>
                              <TableCell className="text-text-secondary">
                                {appt.startTime.toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </TableCell>
                              <TableCell className="text-text-primary">{appt.provider.name}</TableCell>
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
                  {invoices.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-border-strong py-12 text-center">
                      <BillingIconFilled className="h-8 w-8" aria-hidden="true" />
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
                          {invoices.map((invoice) => (
                            <TableRow key={invoice.id}>
                              <TableCell className="font-medium text-text-primary">
                                {invoiceNumber(invoice)}
                              </TableCell>
                              <TableCell className="text-text-secondary">
                                {invoice.issuedAt.toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </TableCell>
                              <TableCell className="font-medium text-text-primary">
                                {formatCentsAsCurrency(invoice.totalCents)}
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
