import { cn } from "@/lib/cn";
import type { TreatmentPlanItem } from "@/generated/prisma/client";

/**
 * Universal numbering, laid out as the patient sees it in a mirror: upper
 * arch #1-#16 left to right, lower arch #32-#17 left to right. Same order
 * as the clinical `ToothChart`, so a tooth sits in the same place whichever
 * portal you're looking at.
 */
const UPPER_TEETH = Array.from({ length: 16 }, (_, i) => i + 1);
const LOWER_TEETH = Array.from({ length: 16 }, (_, i) => 32 - i);

type ToothState = "healthy" | "treated" | "active" | "planned";

/**
 * Tooth types outward from the midline. Index into this with the distance
 * from the centre of an arch and you get the right tooth for that socket:
 * two centrals, then laterals, canines, two premolars, three molars per
 * quadrant — the actual adult dentition, rather than sixteen identical
 * beads.
 */
const TYPES_FROM_CENTRE = [
  "central",
  "lateral",
  "canine",
  "premolar1",
  "premolar2",
  "molar1",
  "molar2",
  "molar3",
] as const;

type ToothType = (typeof TYPES_FROM_CENTRE)[number];

function typeForIndex(indexInArch: number): ToothType {
  // 16 teeth, so the midline sits between index 7 and 8.
  return TYPES_FROM_CENTRE[Math.floor(Math.abs(indexInArch - 7.5))];
}

/**
 * Crown dimensions, mesiodistal (width, along the arch) x buccolingual
 * (height, across it). Proportions follow average adult crown measurements
 * — a first molar really is about 50% wider than a lateral incisor, and
 * that size ladder is most of what makes an arch read as an arch.
 */
const CROWN: Record<ToothType, { w: number; h: number }> = {
  central: { w: 8.6, h: 7.1 },
  lateral: { w: 6.6, h: 6.4 },
  canine: { w: 7.6, h: 8.1 },
  premolar1: { w: 7.1, h: 9.0 },
  premolar2: { w: 6.8, h: 9.1 },
  molar1: { w: 10.3, h: 10.8 },
  molar2: { w: 9.7, h: 10.3 },
  molar3: { w: 8.6, h: 9.5 },
};

/** Lower incisors and canines are markedly narrower than their upper counterparts. */
const LOWER_WIDTH_FACTOR: Partial<Record<ToothType, number>> = {
  central: 0.62,
  lateral: 0.68,
  canine: 0.9,
};

/**
 * Crown outlines seen from the biting surface, drawn in a unit box centred
 * on the origin: x runs mesiodistally, and -y is the cheek/lip side so the
 * detail lines land on the correct face once a tooth is rotated onto the
 * arch.
 */
function crownPath(type: ToothType, w: number, h: number): string {
  const x = (v: number) => (v * w).toFixed(2);
  const y = (v: number) => (v * h).toFixed(2);

  switch (type) {
    case "central":
    case "lateral":
      // A blade: broad flat incisal edge, tapering back to a rounded cingulum.
      return [
        `M${x(-0.5)},${y(-0.28)}`,
        `C${x(-0.5)},${y(-0.45)} ${x(-0.35)},${y(-0.5)} ${x(0)},${y(-0.5)}`,
        `C${x(0.35)},${y(-0.5)} ${x(0.5)},${y(-0.45)} ${x(0.5)},${y(-0.28)}`,
        `C${x(0.5)},${y(0.06)} ${x(0.31)},${y(0.5)} ${x(0)},${y(0.5)}`,
        `C${x(-0.31)},${y(0.5)} ${x(-0.5)},${y(0.06)} ${x(-0.5)},${y(-0.28)}`,
        "Z",
      ].join(" ");

    case "canine":
      // Single pointed cusp toward the lip, shoulders falling away behind it.
      return [
        `M${x(0)},${y(-0.5)}`,
        `C${x(0.25)},${y(-0.43)} ${x(0.5)},${y(-0.19)} ${x(0.5)},${y(0.05)}`,
        `C${x(0.5)},${y(0.33)} ${x(0.29)},${y(0.5)} ${x(0)},${y(0.5)}`,
        `C${x(-0.29)},${y(0.5)} ${x(-0.5)},${y(0.33)} ${x(-0.5)},${y(0.05)}`,
        `C${x(-0.5)},${y(-0.19)} ${x(-0.25)},${y(-0.43)} ${x(0)},${y(-0.5)}`,
        "Z",
      ].join(" ");

    case "premolar1":
    case "premolar2":
      // Ovoid, longer across the cheek-tongue axis than along the arch.
      return [
        `M${x(0)},${y(-0.5)}`,
        `C${x(0.31)},${y(-0.5)} ${x(0.5)},${y(-0.29)} ${x(0.5)},${y(-0.01)}`,
        `C${x(0.5)},${y(0.29)} ${x(0.31)},${y(0.5)} ${x(0)},${y(0.5)}`,
        `C${x(-0.31)},${y(0.5)} ${x(-0.5)},${y(0.29)} ${x(-0.5)},${y(-0.01)}`,
        `C${x(-0.5)},${y(-0.29)} ${x(-0.31)},${y(-0.5)} ${x(0)},${y(-0.5)}`,
        "Z",
      ].join(" ");

    default:
      // Molars: a rounded quadrilateral with slightly bulging cusp corners.
      return [
        `M${x(-0.31)},${y(-0.5)}`,
        `C${x(-0.1)},${y(-0.53)} ${x(0.1)},${y(-0.53)} ${x(0.31)},${y(-0.5)}`,
        `C${x(0.46)},${y(-0.45)} ${x(0.5)},${y(-0.23)} ${x(0.5)},${y(0)}`,
        `C${x(0.5)},${y(0.23)} ${x(0.46)},${y(0.45)} ${x(0.31)},${y(0.5)}`,
        `C${x(0.1)},${y(0.53)} ${x(-0.1)},${y(0.53)} ${x(-0.31)},${y(0.5)}`,
        `C${x(-0.46)},${y(0.45)} ${x(-0.5)},${y(0.23)} ${x(-0.5)},${y(0)}`,
        `C${x(-0.5)},${y(-0.23)} ${x(-0.46)},${y(-0.45)} ${x(-0.31)},${y(-0.5)}`,
        "Z",
      ].join(" ");
  }
}

/** Cusp ridges and developmental grooves — what stops a crown reading as a blob. */
function crownDetail(type: ToothType, w: number, h: number): string {
  const x = (v: number) => (v * w).toFixed(2);
  const y = (v: number) => (v * h).toFixed(2);

  switch (type) {
    case "central":
    case "lateral":
      // The incisal edge, set just inside the biting margin.
      return `M${x(-0.32)},${y(-0.26)} C${x(-0.16)},${y(-0.36)} ${x(0.16)},${y(-0.36)} ${x(0.32)},${y(-0.26)}`;

    case "canine":
      // Ridge running back from the cusp tip.
      return `M${x(0)},${y(-0.38)} L${x(0)},${y(0.12)}`;

    case "premolar1":
    case "premolar2":
      // Single mesiodistal fissure dividing the buccal and lingual cusps.
      return `M${x(-0.27)},${y(0.02)} C${x(-0.1)},${y(-0.05)} ${x(0.1)},${y(-0.05)} ${x(0.27)},${y(0.02)}`;

    case "molar3":
      // Third molars are smaller and their grooves less defined.
      return `M${x(-0.24)},${y(0)} L${x(0.24)},${y(0)}`;

    default:
      // Four cusps: a central fissure crossing a mesiodistal one.
      return [
        `M${x(-0.3)},${y(-0.04)} L${x(0.3)},${y(-0.04)}`,
        `M${x(0)},${y(-0.32)} L${x(0)},${y(0.3)}`,
      ].join(" ");
  }
}

const STATE_FILL: Record<ToothState, string> = {
  // Enamel gets a soft gradient rather than a flat tint so a sound tooth
  // still looks like a tooth; the three states keep the app's flat brand
  // fills so they stay unmistakable.
  healthy: "fill-[url(#enamel)] stroke-border-strong",
  treated: "fill-[var(--color-brand-teal)] stroke-[var(--color-brand-teal)]",
  active: "fill-[var(--color-brand-blue)] stroke-[var(--color-brand-blue)]",
  planned: "fill-info-bg stroke-[var(--color-brand-blue)]",
};

/** Grooves need to sit on top of whichever fill the tooth is carrying. */
const STATE_DETAIL: Record<ToothState, string> = {
  healthy: "stroke-border-strong",
  treated: "stroke-white/60",
  active: "stroke-white/60",
  planned: "stroke-[var(--color-brand-blue)]/50",
};

/**
 * What a patient would call each tooth. "Wisdom tooth" rather than "third
 * molar" — this arch is the patient-facing one, and the clinical
 * `ToothChart` is where the formal name belongs.
 */
const TYPE_LABEL: Record<ToothType, string> = {
  central: "Central",
  lateral: "Lateral",
  canine: "Canine",
  premolar1: "1st premolar",
  premolar2: "2nd premolar",
  molar1: "1st molar",
  molar2: "2nd molar",
  molar3: "Wisdom",
};

const STATE_LABEL: Record<ToothState, string> = {
  healthy: "no treatment planned",
  treated: "treatment completed",
  active: "treatment in progress",
  planned: "treatment planned",
};

function toothNumber(item: Pick<TreatmentPlanItem, "tooth">): number | null {
  const parsed = Number.parseInt((item.tooth ?? "").replace("#", ""), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Highest-priority state wins when a tooth carries more than one plan item. */
function stateFor(items: TreatmentPlanItem[], tooth: number): ToothState {
  const forTooth = items.filter((i) => toothNumber(i) === tooth && i.status !== "DECLINED");
  if (forTooth.some((i) => i.status === "ACTIVE")) return "active";
  if (forTooth.some((i) => i.status === "PLANNED")) return "planned";
  if (forTooth.some((i) => i.status === "COMPLETED")) return "treated";
  return "healthy";
}

// ---------------------------------------------------------------------------
// Arch geometry
// ---------------------------------------------------------------------------

interface Point {
  x: number;
  y: number;
}

type Cubic = [Point, Point, Point, Point];

/**
 * A real arch is a catenary-like U — flat across the front teeth, curving
 * back and running roughly parallel at the molars. A cubic gets that shape
 * far better than the circle these teeth used to sit on, which spaced every
 * tooth identically and read as a bead necklace.
 */
const UPPER_ARCH: Cubic = [
  { x: 20, y: 104 },
  { x: 20, y: -6 },
  { x: 220, y: -6 },
  { x: 220, y: 104 },
];
const LOWER_ARCH: Cubic = [
  { x: 26, y: 136 },
  { x: 26, y: 244 },
  { x: 214, y: 244 },
  { x: 214, y: 136 },
];

function cubicPoint([p0, p1, p2, p3]: Cubic, t: number): Point {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return {
    x: a * p0.x + b * p1.x + c * p2.x + d * p3.x,
    y: a * p0.y + b * p1.y + c * p2.y + d * p3.y,
  };
}

function cubicTangent([p0, p1, p2, p3]: Cubic, t: number): Point {
  const u = 1 - t;
  const a = 3 * u * u;
  const b = 6 * u * t;
  const c = 3 * t * t;
  return {
    x: a * (p1.x - p0.x) + b * (p2.x - p1.x) + c * (p3.x - p2.x),
    y: a * (p1.y - p0.y) + b * (p2.y - p1.y) + c * (p3.y - p2.y),
  };
}

const SAMPLES = 600;

/** Arc-length table, so teeth can be spaced by real distance along the curve. */
function measure(curve: Cubic) {
  const cumulative = [0];
  let previous = cubicPoint(curve, 0);
  for (let i = 1; i <= SAMPLES; i++) {
    const point = cubicPoint(curve, i / SAMPLES);
    cumulative.push(cumulative[i - 1] + Math.hypot(point.x - previous.x, point.y - previous.y));
    previous = point;
  }
  return { cumulative, length: cumulative[SAMPLES] };
}

/** Curve parameter `t` at a given distance along the curve. */
function tAtDistance(cumulative: number[], distance: number): number {
  let lo = 0;
  let hi = cumulative.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (cumulative[mid] < distance) lo = mid + 1;
    else hi = mid;
  }
  return lo / SAMPLES;
}

interface PlacedTooth {
  number: number;
  type: ToothType;
  state: ToothState;
  x: number;
  y: number;
  rotation: number;
  w: number;
  h: number;
}

/**
 * Walks the arch laying crowns down edge to edge. Because each step is the
 * tooth's own width, molars take up the room molars actually take up — the
 * spacing carries the anatomy as much as the outlines do.
 */
function layoutArch(
  teeth: number[],
  curve: Cubic,
  items: TreatmentPlanItem[],
  isLower: boolean,
): PlacedTooth[] {
  const gap = 0.7;
  const crowns = teeth.map((_, i) => {
    const type = typeForIndex(i);
    const base = CROWN[type];
    const widthFactor = isLower ? (LOWER_WIDTH_FACTOR[type] ?? 1) : 1;
    return { type, w: base.w * widthFactor, h: base.h };
  });

  const { cumulative, length } = measure(curve);
  const span = crowns.reduce((sum, c) => sum + c.w, 0) + gap * (teeth.length - 1);
  // Fit the row to the arch instead of leaving it adrift in the middle.
  const scale = length / span;
  let travelled = 0;

  return teeth.map((number, i) => {
    const crown = crowns[i];
    const width = crown.w * scale;
    const centre = travelled + width / 2;
    travelled += width + gap * scale;

    const t = tAtDistance(cumulative, centre);
    const point = cubicPoint(curve, t);
    const tangent = cubicTangent(curve, t);
    const norm = Math.hypot(tangent.x, tangent.y) || 1;
    // Outward normal — away from the centre of the mouth, so -y in the
    // crown's own space ends up facing the cheek.
    const sign = isLower ? -1 : 1;
    const nx = (sign * -tangent.y) / norm;
    const ny = (sign * tangent.x) / norm;

    return {
      number,
      type: crown.type,
      state: stateFor(items, number),
      x: point.x,
      y: point.y,
      // Rotating (0,-1) by `a` gives (sin a, -cos a); solve that for the normal.
      rotation: (Math.atan2(nx, -ny) * 180) / Math.PI,
      w: width,
      h: crown.h * scale,
    };
  });
}

/**
 * Pushes stacked callout labels apart so two teeth close together on the
 * arch don't end up with overlapping text, then slides the whole column
 * back inside the frame if spreading pushed it past the bottom.
 */
function spreadLabels(ys: number[], minGap: number, min: number, max: number): number[] {
  const out = [...ys];
  for (let i = 1; i < out.length; i++) {
    if (out[i] - out[i - 1] < minGap) out[i] = out[i - 1] + minGap;
  }
  const overflow = out[out.length - 1] - max;
  if (overflow > 0) for (let i = 0; i < out.length; i++) out[i] -= overflow;
  if (out[0] < min) {
    const shift = min - out[0];
    for (let i = 0; i < out.length; i++) out[i] += shift;
  }
  return out;
}

interface Callout {
  tooth: PlacedTooth;
  /** Where the leader meets the tooth — just off its outer face. */
  fromX: number;
  fromY: number;
  /** Where the leader ends and the text begins. */
  toX: number;
  toY: number;
  side: "left" | "right";
}

/** Leader lines from each flagged tooth out to a label in the margin. */
function buildCallouts(placed: PlacedTooth[]): Callout[] {
  const flagged = placed.filter((t) => t.state !== "healthy");

  return (["left", "right"] as const).flatMap((side) => {
    const onSide = flagged
      .filter((t) => (side === "left" ? t.x < 120 : t.x >= 120))
      .sort((a, b) => a.y - b.y);
    if (onSide.length === 0) return [];

    const labelX = side === "left" ? -10 : 250;
    const ys = spreadLabels(onSide.map((t) => t.y), 30, 8, 232);

    return onSide.map((tooth, i) => {
      // The crown's -y axis faces outward; after `rotation` that direction
      // is (sin, -cos), so this lands the leader just clear of the enamel.
      const rad = (tooth.rotation * Math.PI) / 180;
      const reach = tooth.h / 2 + 3;
      return {
        tooth,
        fromX: tooth.x + Math.sin(rad) * reach,
        fromY: tooth.y - Math.cos(rad) * reach,
        toX: labelX,
        toY: ys[i],
        side,
      };
    });
  });
}

export interface TeethAtAGlanceProps {
  items: TreatmentPlanItem[];
}

/**
 * The patient-facing counterpart to the clinical `ToothChart`: a dental
 * arch showing, at a glance, which teeth have something happening and how
 * many are simply fine.
 *
 * Deliberately not a clinical record — it reads only the treatment plan, so
 * "healthy" here means "no open plan item", not "examined and sound". The
 * caption says so, because the encouraging headline number would otherwise
 * overstate what the app actually knows.
 */
export function TeethAtAGlance({ items }: TeethAtAGlanceProps) {
  const placed = [
    ...layoutArch(UPPER_TEETH, UPPER_ARCH, items, false),
    ...layoutArch(LOWER_TEETH, LOWER_ARCH, items, true),
  ];

  const needsAttention = placed.filter((t) => t.state === "active" || t.state === "planned");
  const healthyCount = placed.length - needsAttention.length;
  const callouts = buildCallouts(placed);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* The frame is wider than the arch so the callouts have a margin to
          sit in, and stays symmetric about the arch's centre (120,120) so
          the headline overlay below still lands in the middle. */}
      <div className="relative mx-auto aspect-[424/268] w-full max-w-[420px]">
        <svg
          viewBox="-92 -14 424 268"
          className="animate-pop-in h-full w-full"
          role="img"
          aria-label={`Dental arch: ${healthyCount} of ${placed.length} teeth have no open treatment.`}
        >
          <defs>
            <linearGradient id="enamel" x1="0" y1="0" x2="0.35" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="55%" stopColor="#f7fafc" />
              <stop offset="100%" stopColor="#e8eef6" />
            </linearGradient>
          </defs>

          {/* Drawn before the teeth so a leader never crosses over enamel. */}
          {callouts.map((callout) => (
            <g key={`leader-${callout.tooth.number}`} aria-hidden="true">
              <polyline
                points={`${callout.fromX.toFixed(1)},${callout.fromY.toFixed(1)} ${(callout.side === "left" ? callout.toX + 12 : callout.toX - 12).toFixed(1)},${callout.toY.toFixed(1)} ${callout.toX.toFixed(1)},${callout.toY.toFixed(1)}`}
                fill="none"
                strokeWidth={0.9}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="stroke-border-strong"
              />
              <circle
                cx={callout.fromX.toFixed(1)}
                cy={callout.fromY.toFixed(1)}
                r={1.6}
                className={
                  callout.tooth.state === "treated"
                    ? "fill-[var(--color-brand-teal)]"
                    : "fill-[var(--color-brand-blue)]"
                }
              />
            </g>
          ))}

          {placed.map((tooth) => (
            <g
              key={tooth.number}
              transform={`translate(${tooth.x.toFixed(2)} ${tooth.y.toFixed(2)}) rotate(${tooth.rotation.toFixed(2)})`}
              className="tooth"
            >
              <title>{`Tooth #${tooth.number} — ${STATE_LABEL[tooth.state]}`}</title>
              <path
                d={crownPath(tooth.type, tooth.w, tooth.h)}
                strokeWidth={0.9}
                strokeLinejoin="round"
                className={cn("transition-colors duration-300 ease-out", STATE_FILL[tooth.state])}
              />
              <path
                d={crownDetail(tooth.type, tooth.w, tooth.h)}
                fill="none"
                strokeWidth={0.7}
                strokeLinecap="round"
                className={cn("transition-colors duration-300 ease-out", STATE_DETAIL[tooth.state])}
              />
            </g>
          ))}

          {callouts.map((callout) => (
            <text
              key={`label-${callout.tooth.number}`}
              x={callout.side === "left" ? callout.toX - 4 : callout.toX + 4}
              y={callout.toY}
              textAnchor={callout.side === "left" ? "end" : "start"}
              className="fill-text-primary text-[10px] font-semibold"
            >
              {TYPE_LABEL[callout.tooth.type]}
              <tspan
                x={callout.side === "left" ? callout.toX - 4 : callout.toX + 4}
                dy="10"
                className="fill-text-secondary text-[9px] font-normal"
              >
                {`#${callout.tooth.number}`}
              </tspan>
            </text>
          ))}
        </svg>

        {/* Centred over the arch rather than inside the SVG: real text scales
            and wraps with the rest of the page, an SVG <text> element does not. */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="text-2xl font-bold leading-none tracking-tight text-text-primary">
            {healthyCount} of {placed.length}
          </p>
          <p className="mt-1 text-xs text-text-secondary">teeth are healthy</p>
        </div>
      </div>

      <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-text-secondary">
        {(["active", "planned", "treated", "healthy"] as const).map((state) => (
          <li key={state} className="inline-flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className={cn(
                "h-2.5 w-2.5 rounded-full border",
                state === "healthy" && "border-border-strong bg-surface",
                state === "treated" && "border-[var(--color-brand-teal)] bg-[var(--color-brand-teal)]",
                state === "active" && "border-[var(--color-brand-blue)] bg-[var(--color-brand-blue)]",
                state === "planned" && "border-[var(--color-brand-blue)] bg-info-bg",
              )}
            />
            {state === "healthy"
              ? "No plan"
              : state === "treated"
                ? "Completed"
                : state === "active"
                  ? "In progress"
                  : "Planned"}
          </li>
        ))}
      </ul>

      <p className="max-w-xs text-center text-[11px] leading-relaxed text-text-secondary">
        Based on your treatment plan — teeth without an open plan item are shown as healthy.
      </p>
    </div>
  );
}
