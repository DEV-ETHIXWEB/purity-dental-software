"use client";

import { useSyncExternalStore } from "react";
import { patients as samplePatients, type SamplePatient } from "@/lib/sample-data";

/**
 * PLACEHOLDER CLIENT-SIDE STORE — pending real database wiring.
 *
 * The Receptionist portal's patient registration flow needs newly-registered
 * patients to show up immediately in the patients list and be reachable at
 * `/receptionist/patients/[patientId]` after a client-side navigation. There
 * is no backend to persist to yet (see `sample-data.ts`'s own placeholder
 * comment), and the imported `patients` array can't be mutated persistently
 * across a route change. This module is a minimal in-memory singleton store
 * (module-level state + `useSyncExternalStore`) that layers newly-registered
 * patients on top of the read-only sample roster for the lifetime of the
 * browser tab. It intentionally does NOT persist across a full page reload —
 * replace with real Prisma queries once patient registration is wired to a
 * live database.
 */

let registeredPatients: SamplePatient[] = [];
const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return registeredPatients;
}

function getServerSnapshot() {
  return [] as SamplePatient[];
}

/** Add a newly-registered patient to the in-memory store. Client-only, tab-lifetime only. */
export function addRegisteredPatient(patient: SamplePatient) {
  registeredPatients = [...registeredPatients, patient];
  emitChange();
}

/** All patients: the static sample roster plus any registered this session. */
export function useAllPatients(): SamplePatient[] {
  const registered = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return useMemoCombined(registered);
}

function useMemoCombined(registered: SamplePatient[]) {
  // Small enough lists that a plain concat per render is fine — avoids
  // pulling in useMemo just to skip a handful of array spreads.
  return [...samplePatients, ...registered];
}

/** Look up a patient by id across both the sample roster and session-registered patients. */
export function useFindPatientById(id: string): SamplePatient | null {
  const all = useAllPatients();
  return all.find((p) => p.id === id) ?? null;
}
