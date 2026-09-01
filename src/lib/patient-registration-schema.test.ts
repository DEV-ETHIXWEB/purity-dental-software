import { describe, expect, it } from "vitest";
import { patientRegistrationSchema } from "./patient-registration-schema";

const validInput = {
  firstName: "Jane",
  lastName: "Doe",
  dateOfBirth: "1990-05-15",
  sex: "FEMALE" as const,
  phone: "(555) 123-4567",
  email: "jane.doe@example.com",
  insuranceProvider: "Delta Dental",
  insurancePlan: "PPO Plus",
};

describe("patientRegistrationSchema", () => {
  it("accepts fully valid input", () => {
    const result = patientRegistrationSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("rejects missing required fields with field-level errors", () => {
    const result = patientRegistrationSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0]);
      expect(paths).toEqual(
        expect.arrayContaining([
          "firstName",
          "lastName",
          "dateOfBirth",
          "sex",
          "phone",
          "email",
          "insuranceProvider",
          "insurancePlan",
        ]),
      );
    }
  });

  it("rejects an empty first name", () => {
    const result = patientRegistrationSchema.safeParse({ ...validInput, firstName: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === "firstName")).toBe(true);
    }
  });

  it("rejects an invalid email format", () => {
    const result = patientRegistrationSchema.safeParse({ ...validInput, email: "not-an-email" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === "email")).toBe(true);
    }
  });

  it("rejects an invalid phone number format", () => {
    const result = patientRegistrationSchema.safeParse({ ...validInput, phone: "call-me-maybe" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === "phone")).toBe(true);
    }
  });

  it("rejects a phone number that's too short", () => {
    const result = patientRegistrationSchema.safeParse({ ...validInput, phone: "12345" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === "phone")).toBe(true);
    }
  });

  it("accepts a phone number with a country code and separators", () => {
    const result = patientRegistrationSchema.safeParse({ ...validInput, phone: "+1 555-123-4567" });
    expect(result.success).toBe(true);
  });

  it("rejects a future date of birth", () => {
    const futureYear = new Date().getFullYear() + 1;
    const result = patientRegistrationSchema.safeParse({
      ...validInput,
      dateOfBirth: `${futureYear}-01-01`,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === "dateOfBirth")).toBe(true);
    }
  });

  it("rejects a date of birth more than ~130 years ago", () => {
    const tooOldYear = new Date().getFullYear() - 131;
    const result = patientRegistrationSchema.safeParse({
      ...validInput,
      dateOfBirth: `${tooOldYear}-01-01`,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === "dateOfBirth")).toBe(true);
    }
  });

  it("accepts a date of birth just under the 130-year boundary", () => {
    const okYear = new Date().getFullYear() - 129;
    const result = patientRegistrationSchema.safeParse({
      ...validInput,
      dateOfBirth: `${okYear}-01-01`,
    });
    expect(result.success).toBe(true);
  });

  it("rejects an unparseable date of birth string", () => {
    const result = patientRegistrationSchema.safeParse({
      ...validInput,
      dateOfBirth: "not-a-date",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid sex enum value", () => {
    const result = patientRegistrationSchema.safeParse({ ...validInput, sex: "UNKNOWN" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === "sex")).toBe(true);
    }
  });

  it("accepts all three valid sex enum values", () => {
    for (const sex of ["MALE", "FEMALE", "OTHER"] as const) {
      const result = patientRegistrationSchema.safeParse({ ...validInput, sex });
      expect(result.success).toBe(true);
    }
  });

  it("trims whitespace from string fields", () => {
    const result = patientRegistrationSchema.safeParse({
      ...validInput,
      firstName: "  Jane  ",
      lastName: "  Doe  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.firstName).toBe("Jane");
      expect(result.data.lastName).toBe("Doe");
    }
  });
});
