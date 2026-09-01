import { z } from "zod";

/**
 * Validation schema for the Receptionist portal's patient registration form.
 * Field shapes mirror `SamplePatient` in `sample-data.ts` (first/last name,
 * DOB, sex, phone, email, insurance provider/plan) so a valid submission
 * maps directly onto that interface.
 */
export const patientRegistrationSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "First name is required.")
    .max(60, "First name is too long."),
  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required.")
    .max(60, "Last name is too long."),
  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required.")
    .refine((val) => !Number.isNaN(new Date(val).getTime()), {
      message: "Enter a valid date.",
    })
    .refine(
      (val) => {
        const date = new Date(val);
        return date.getTime() <= Date.now();
      },
      { message: "Date of birth can't be in the future." },
    )
    .refine(
      (val) => {
        const date = new Date(val);
        const minDate = new Date();
        minDate.setFullYear(minDate.getFullYear() - 130);
        return date.getTime() >= minDate.getTime();
      },
      { message: "Enter a realistic date of birth." },
    ),
  sex: z.enum(["MALE", "FEMALE", "OTHER"], {
    error: "Select a sex on file.",
  }),
  phone: z
    .string()
    .trim()
    .min(1, "Phone number is required.")
    .regex(
      /^[+]?[\d\s().-]{7,20}$/,
      "Enter a valid phone number (digits, spaces, and ()+- only).",
    )
    .refine((val) => val.replace(/\D/g, "").length >= 7, {
      message: "Phone number is too short.",
    }),
  email: z
    .string()
    .trim()
    .min(1, "Email is required.")
    .email("Enter a valid email address."),
  insuranceProvider: z
    .string()
    .trim()
    .min(1, "Insurance provider is required.")
    .max(80, "Insurance provider name is too long."),
  insurancePlan: z
    .string()
    .trim()
    .min(1, "Insurance plan is required.")
    .max(80, "Insurance plan name is too long."),
});

export type PatientRegistrationInput = z.infer<typeof patientRegistrationSchema>;

/** Flattened field-level error messages, keyed by field name. */
export type PatientRegistrationErrors = Partial<
  Record<keyof PatientRegistrationInput, string>
>;
