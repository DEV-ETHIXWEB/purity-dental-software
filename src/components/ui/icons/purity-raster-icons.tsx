import { cn } from "@/lib/cn";

export interface RasterIconProps {
  className?: string;
  /** Which exported artwork to show — defaults to the richer "filled" look used everywhere outside the nav rail's inactive state. */
  variant?: "outline" | "filled";
}

/**
 * The Purity icon set's batch-3/4 icons only exist as PNG exports (no SVG
 * source was provided), each shipped as an outline/filled pair under
 * `/public/icons/<slug>-<variant>.png`. This wraps that convention in a
 * component with the same `{ className }` shape as the SVG-based icons in
 * `purity-icons.tsx`, so both families are interchangeable at call sites.
 */
function createRasterIcon(slug: string) {
  function RasterIcon({ className, variant = "filled" }: RasterIconProps) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- decorative, fixed small icon; next/image's layout constraints add no value here
      <img
        src={`/icons/${slug}-${variant}.png`}
        alt=""
        aria-hidden="true"
        className={cn("object-contain", className)}
      />
    );
  }
  RasterIcon.displayName = `${slug}Icon`;
  return RasterIcon;
}

export const PrescriptionIcon = createRasterIcon("prescription");
export const HistoryIcon = createRasterIcon("history");
export const InsuranceIcon = createRasterIcon("insurance");
export const SettingsIcon = createRasterIcon("settings");
export const HeadsetIcon = createRasterIcon("headset");
export const PhoneIcon = createRasterIcon("phone");
export const UploadIcon = createRasterIcon("upload");
export const WarningIcon = createRasterIcon("warning");
export const ReportsIcon = createRasterIcon("reports");
export const XRaysIcon = createRasterIcon("xrays");
export const HomeIcon = createRasterIcon("home");
export const SearchIcon = createRasterIcon("search");
export const LocationIcon = createRasterIcon("location");
export const EmailIcon = createRasterIcon("email");
export const CheckmarkIcon = createRasterIcon("checkmark");
export const InfoIcon = createRasterIcon("info");
