import type { Metadata } from "next";
import { Pill } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { EmptyState } from "@/components/patient/EmptyState";
import { TreatmentPlanCard } from "@/components/patient/TreatmentPlanCard";
import { ConsentFormCard } from "@/components/patient/ConsentFormCard";
import { SwitchDentistModal } from "@/components/patient/SwitchDentistModal";
import {
  consentFormsForPatient,
  currentPatient,
  currentProvider,
  prescriptionsForPatient,
  treatmentPlanForPatient,
} from "@/lib/sample-data";
import { formatShortDate } from "@/components/patient/formatters";

export const metadata: Metadata = {
  title: "My Care",
  description: "Your treatment plan, forms to sign, and prescriptions in one place.",
};

export default function PatientCarePage() {
  const plan = treatmentPlanForPatient(currentPatient.id);
  const forms = consentFormsForPatient(currentPatient.id);
  const scripts = prescriptionsForPatient(currentPatient.id);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">My Care</h1>
          <p className="text-sm text-text-secondary">
            Here&apos;s how your treatment is going, along with any forms and prescriptions on file.
          </p>
        </div>
        <SwitchDentistModal />
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
            icon={Pill}
            title="No treatment plan on file"
            description="When your provider puts together a plan, it will show up here."
          />
        )}
      </section>

      <section aria-labelledby="forms-heading" className="flex flex-col gap-3">
        <h2 id="forms-heading" className="text-lg font-semibold text-text-primary">
          Forms to sign
        </h2>
        {forms.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {forms.map((form) => (
              <ConsentFormCard key={form.id} form={form} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Pill}
            title="Nothing to sign right now"
            description="Any forms that need your signature will show up here."
          />
        )}
      </section>

      <section aria-labelledby="rx-heading" className="flex flex-col gap-3">
        <h2 id="rx-heading" className="text-lg font-semibold text-text-primary">
          Prescriptions
        </h2>
        {scripts.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {scripts.map((rx) => (
              <Card key={rx.id} className="flex flex-col gap-1 p-5">
                <div className="flex items-center gap-2">
                  <Pill className="h-4 w-4 text-[var(--color-brand-teal-text)]" aria-hidden="true" />
                  <p className="text-sm font-semibold text-text-primary">{rx.medication}</p>
                </div>
                <p className="text-sm text-text-secondary">{rx.instructions}</p>
                <p className="text-xs text-text-secondary">
                  Prescribed {formatShortDate(rx.prescribedAt)} by {rx.prescribedBy}
                </p>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Pill}
            title="No prescriptions on file"
            description="Any prescriptions from your care team will appear here."
          />
        )}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Your dentist</CardTitle>
          <CardDescription>You&apos;re currently seeing {currentProvider.name}.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-text-secondary">
            Want to see someone else at the practice? Use the &ldquo;Switch dentist&rdquo; button above to request a change.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
