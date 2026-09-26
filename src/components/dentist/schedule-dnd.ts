/**
 * What travels on the schedule board's drag-and-drop.
 *
 * Two different things get dragged onto the same hour rows — a waitlist entry
 * being booked in, and an appointment already on the board being moved — so
 * the drop target has to know which it's receiving. A bare patient id (what
 * the waitlist used to put on the wire) can't say.
 */

export type SchedulePayload =
  | { kind: "waitlist"; id: string }
  | { kind: "appointment"; id: string };

/**
 * Custom MIME type so `dragover` can tell whether a drag is ours *before* it
 * is dropped. The spec deliberately hides `getData()` during dragover — only
 * `types` is readable — so without a distinctive type there is no way to
 * refuse a drag from outside the app except by accepting it and failing.
 */
export const SCHEDULE_DND_MIME = "application/x-purity-schedule";

export function writeDragPayload(dataTransfer: DataTransfer, payload: SchedulePayload): void {
  const json = JSON.stringify(payload);
  dataTransfer.setData(SCHEDULE_DND_MIME, json);
  // Also as text/plain: some browsers refuse to start a drag that carries
  // only an unknown custom type.
  dataTransfer.setData("text/plain", json);
  dataTransfer.effectAllowed = payload.kind === "waitlist" ? "copy" : "move";
}

/** Whether an in-flight drag is one of ours — the only check `dragover` can make. */
export function isSchedulePayload(dataTransfer: DataTransfer): boolean {
  return Array.from(dataTransfer.types).includes(SCHEDULE_DND_MIME);
}

export function readDragPayload(dataTransfer: DataTransfer): SchedulePayload | null {
  const raw = dataTransfer.getData(SCHEDULE_DND_MIME) || dataTransfer.getData("text/plain");
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "kind" in parsed &&
      "id" in parsed &&
      (parsed.kind === "waitlist" || parsed.kind === "appointment") &&
      typeof parsed.id === "string"
    ) {
      return parsed as SchedulePayload;
    }
  } catch {
    // Something else was dropped on the board; ignore it.
  }
  return null;
}
