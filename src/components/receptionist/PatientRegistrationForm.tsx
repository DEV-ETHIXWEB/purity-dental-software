"use client";

import { useId, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { registerPatient } from "@/lib/actions/register-patient";
import {
  patientRegistrationSchema,
  type PatientRegistrationInput,
  type PatientRegistrationErrors,
} from "@/lib/patient-registration-schema";

const SEX_OPTIONS: { value: PatientRegistrationInput["sex"]; label: string }[] = [
  { value: "FEMALE", label: "Female" },
  { value: "MALE", label: "Male" },
  { value: "OTHER", label: "Other" },
];

const EMPTY_FORM: PatientRegistrationInput = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  sex: "FEMALE",
  phone: "",
  email: "",
  insuranceProvider: "",
  insurancePlan: "",
};

/**
 * Multi-field new-patient registration form. Client-side validated with zod
 * (required fields, email/phone format, DOB must be a real, non-future,
 * plausible date) with inline field-level errors, then submitted to the
 * `registerPatient` Server Action (`src/lib/actions/register-patient.ts`),
 * which independently re-validates and re-authorizes server-side — see
 * that file's header comment for why the Server Action can't rely on this
 * client-side check or on middleware alone.
 *
 * The action performs a real Prisma write, scoped to the signed-in
 * receptionist's own organization; a database-unavailable error surfaces
 * here as a clear message rather than a raw 500/stack trace.
 */
export function PatientRegistrationForm() {
  const router = useRouter();
  const formId = useId();
  const [values, setValues] = useState<PatientRegistrationInput>(EMPTY_FORM);
  const [errors, setErrors] = useState<PatientRegistrationErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);

  function setField<K extends keyof PatientRegistrationInput>(field: K, value: PatientRegistrationInput[K]) {
    setValues((prev) => ({ ...prev, [field]: value }));
    // Clear that field's error as soon as the person edits it again, rather
    // than making them resubmit to find out it's fixed.
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError(null);

    const result = patientRegistrationSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors: PatientRegistrationErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof PatientRegistrationInput | undefined;
        if (field && !fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      // Move focus to the first invalid field so keyboard/screen-reader users
      // land directly on what needs fixing.
      const firstField = Object.keys(fieldErrors)[0];
      if (firstField) {
        document.getElementById(`${formId}-${firstField}`)?.focus();
      }
      return;
    }

    setStatus("submitting");
    const data = result.data;

    try {
      const formPayload = new FormData();
      for (const [key, value] of Object.entries(data)) {
        formPayload.set(key, value);
      }

      const actionResult = await registerPatient(formPayload);

      if (actionResult.status === "success") {
        setStatus("success");
        router.push(`/receptionist/patients/${actionResult.patientId}`);
        return;
      }

      setStatus("error");
      setSubmitError(actionResult.message);
      if (actionResult.fieldErrors) {
        setErrors(actionResult.fieldErrors as PatientRegistrationErrors);
      }
    } catch {
      setStatus("error");
      setSubmitError("Something went wrong while registering this patient. Please try again.");
    }
  }

  const isSubmitting = status === "submitting" || status === "success";

  return (
    <Card>
      <CardHeader className="flex-col items-start gap-1">
        <CardTitle>Patient Details</CardTitle>
        <CardDescription>
          Fields marked required must be completed before the patient record can be created.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-6">
          <fieldset className="flex flex-col gap-4" disabled={isSubmitting}>
            <legend className="mb-1 text-sm font-semibold text-text-primary">Personal Information</legend>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                id={`${formId}-firstName`}
                label="First name"
                required
                value={values.firstName}
                error={errors.firstName}
                onChange={(v) => setField("firstName", v)}
                autoComplete="given-name"
              />
              <FormField
                id={`${formId}-lastName`}
                label="Last name"
                required
                value={values.lastName}
                error={errors.lastName}
                onChange={(v) => setField("lastName", v)}
                autoComplete="family-name"
              />
              <FormField
                id={`${formId}-dateOfBirth`}
                label="Date of birth"
                required
                type="date"
                value={values.dateOfBirth}
                error={errors.dateOfBirth}
                onChange={(v) => setField("dateOfBirth", v)}
                autoComplete="bday"
              />
              <div className="flex flex-col gap-1.5">
                <label htmlFor={`${formId}-sex`} className="text-sm font-medium text-text-primary">
                  Sex on file <span aria-hidden="true">*</span>
                </label>
                <select
                  id={`${formId}-sex`}
                  value={values.sex}
                  onChange={(e) => setField("sex", e.target.value as PatientRegistrationInput["sex"])}
                  aria-invalid={!!errors.sex}
                  aria-describedby={errors.sex ? `${formId}-sex-error` : undefined}
                  className={cn(
                    "h-10 rounded-[var(--radius-md)] border border-border bg-surface px-3 text-sm text-text-primary",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]",
                    "disabled:opacity-50 disabled:pointer-events-none",
                    errors.sex && "border-error",
                  )}
                >
                  {SEX_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {errors.sex && (
                  <p id={`${formId}-sex-error`} className="text-xs font-medium text-error-text">
                    {errors.sex}
                  </p>
                )}
              </div>
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-4" disabled={isSubmitting}>
            <legend className="mb-1 text-sm font-semibold text-text-primary">Contact Information</legend>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                id={`${formId}-phone`}
                label="Phone"
                required
                type="tel"
                value={values.phone}
                error={errors.phone}
                onChange={(v) => setField("phone", v)}
                autoComplete="tel"
                placeholder="(555) 123-4567"
              />
              <FormField
                id={`${formId}-email`}
                label="Email"
                required
                type="email"
                value={values.email}
                error={errors.email}
                onChange={(v) => setField("email", v)}
                autoComplete="email"
                placeholder="patient@example.com"
              />
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-4" disabled={isSubmitting}>
            <legend className="mb-1 text-sm font-semibold text-text-primary">Insurance</legend>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                id={`${formId}-insuranceProvider`}
                label="Insurance provider"
                required
                value={values.insuranceProvider}
                error={errors.insuranceProvider}
                onChange={(v) => setField("insuranceProvider", v)}
                placeholder="Delta Dental"
              />
              <FormField
                id={`${formId}-insurancePlan`}
                label="Insurance plan"
                required
                value={values.insurancePlan}
                error={errors.insurancePlan}
                onChange={(v) => setField("insurancePlan", v)}
                placeholder="PPO Plus"
              />
            </div>
          </fieldset>

          {submitError && (
            <p role="alert" className="rounded-[var(--radius-md)] bg-error-bg px-3 py-2 text-sm font-medium text-error-text">
              {submitError}
            </p>
          )}

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {status === "submitting" && (
                <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
              )}
              {status === "success" && <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
              {status === "submitting"
                ? "Registering…"
                : status === "success"
                  ? "Registered"
                  : "Register Patient"}
            </Button>
            <p className="text-xs text-text-secondary" aria-live="polite">
              {status === "submitting" && "Creating the patient record…"}
              {status === "success" && "Patient registered. Opening their profile…"}
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

interface FormFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
}

function FormField({
  id,
  label,
  value,
  onChange,
  error,
  required,
  type = "text",
  autoComplete,
  placeholder,
}: FormFieldProps) {
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <Input
        id={id}
        label={`${label}${required ? " *" : ""}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required={required}
        aria-invalid={!!error}
        aria-describedby={errorId}
        className={cn(error && "border-error focus-visible:outline-error")}
      />
      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-error-text">
          {error}
        </p>
      )}
    </div>
  );
}
