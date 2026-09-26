import { describe, expect, it } from "vitest";
import { initials } from "@/components/ui/Avatar";

describe("initials", () => {
  it("ignores an honorific so the initials come from the name", () => {
    // The bug: "Dr. Mia Chen-Ward" rendered as "DC" on the Team screen,
    // taking the "Dr." as the first name.
    expect(initials("Dr. Mia Chen-Ward")).toBe("MC");
    expect(initials("Dr Raj Kapoor")).toBe("RK");
    expect(initials("Prof. Alan Turing")).toBe("AT");
  });

  it("ignores credentials after a comma", () => {
    expect(initials("Dana Reyes, RDH")).toBe("DR");
    expect(initials("Emily Avery, DDS, MS")).toBe("EA");
  });

  it("handles an honorific and credentials together", () => {
    expect(initials("Dr. Mia Chen-Ward, DMD")).toBe("MC");
  });

  it("leaves ordinary names alone", () => {
    expect(initials("Sarah Johnson")).toBe("SJ");
    expect(initials("Priya Nair")).toBe("PN");
  });

  it("falls back to a single letter for a one-word name", () => {
    expect(initials("Madonna")).toBe("M");
  });

  it("still returns something when the name is only a title", () => {
    // Better a letter than an empty circle.
    expect(initials("Dr.")).toBe("D");
  });

  it("returns an empty string for an empty name rather than throwing", () => {
    expect(initials("   ")).toBe("");
  });
});
