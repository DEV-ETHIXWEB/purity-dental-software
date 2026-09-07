import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { EmptyState } from "@/components/patient/EmptyState";
import { ToothIconFilled, CrownIconFilled, SignatureIconFilled, DoctorIconFilled } from "@/components/ui/icons/purity-icons";
import { PrescriptionIcon } from "@/components/ui/icons/purity-raster-icons";
import { TreatmentPlanCard } from "@/components/patient/TreatmentPlanCard";
import { SwitchDentistModal } from "@/components/patient/SwitchDentistModal";
import { requireRole } from "@/lib/auth/authorize";
import { getPatientForUser } from "@/lib/data/patients";
import { treatmentPlanForPatient } from "@/lib/data/treatment";
import { listProviders } from "@/lib/data/providers";

export const metadata: Metadata = {
  title: "My Care",
  description: "Your treatment plan, forms to sign, and prescriptions in one place.",
};

export default async function PatientCarePage() {
  const session = await requireRole(["PATIENT"]);
  const patient = await getPatientForUser(session.user.id);
  if (!patient) notFound();

  const [plan, providers] = await Promise.all([
    treatmentPlanForPatient(session.user.organizationId, patient.id),
    listProviders(session.user.organizationId),
  ]);
  const currentProvider = providers[0] ?? null;
  const alternateProviders = providers.slice(1);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-muted">
            <ToothIconFilled className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">My Care</h1>
            <p className="text-sm text-text-secondary">
              Here&apos;s how your treatment is going, along with any forms and prescriptions on file.
            </p>
          </div>
        </div>
        {currentProvider && (
          <SwitchDentistModal
            patientId={patient.id}
            currentProviderName={currentProvider.name}
            alternateProviders={alternateProviders}
          />
        )}
      </div>

      <section aria-labelledby="treatment-heading" className="flex flex-col gap-3">
        <h2 id="treatment-heading" className="text-lg font-semibold text-text-primary">
          Your treatment plan
        </h2>
        {plan.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {plan.map((item) => (
              <TreatmentPlanCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={CrownIconFilled}
            title="No treatment plan on file"
            description="When your provider puts together a plan, it will show up here."
          />
        )}
      </section>

      {/*
       * Forms-to-sign and prescriptions have no backing Prisma model yet —
       * both need real document storage / e-signature and e-prescribing
       * integrations respectively, which are out of scope for this pass.
       * Rendering honest empty states here rather than fabricated per-patient
       * content, consistent with the rest of the app no longer using
       * placeholder data.
       */}
      <section aria-labelledby="forms-heading" className="flex flex-col gap-3">
        <h2 id="forms-heading" className="text-lg font-semibold text-text-primary">
          Forms to sign
        </h2>
        <EmptyState
          icon={SignatureIconFilled}
          title="Nothing to sign right now"
          description="Any forms that need your signature will show up here."
        />
      </section>

      <section aria-labelledby="rx-heading" className="flex flex-col gap-3">
        <h2 id="rx-heading" className="text-lg font-semibold text-text-primary">
          Prescriptions
        </h2>
        <EmptyState
          icon={PrescriptionIcon}
          title="No prescriptions on file"
          description="Any prescriptions from your care team will appear here."
        />
      </section>

      {currentProvider && (
        <Card>
          <CardHeader className="justify-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-muted">
              <DoctorIconFilled className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <CardTitle>Your dentist</CardTitle>
              <CardDescription>You&apos;re currently seeing {currentProvider.name}.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-text-secondary">
              Want to see someone else at the practice? Use the &ldquo;Switch dentist&rdquo; button above to request a change.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
