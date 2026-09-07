import { Plus, UserPlus, Bell, Wallet, HeartPulse, type LucideIcon } from "lucide-react";
import {
  CalendarIcon,
  CalendarIconFilled,
  PersonIcon,
  PersonIconFilled,
  BillingIcon,
  BillingIconFilled,
  ChatIcon,
  ChatIconFilled,
  ChecklistIcon,
  ChecklistIconFilled,
} from "@/components/ui/icons/purity-icons";
import { HomeIcon, SettingsIcon, HeadsetIcon, type RasterIconProps } from "@/components/ui/icons/purity-raster-icons";
import type { ComponentType } from "react";

type IconComponent = ComponentType<{ className?: string }>;

interface IconPair {
  /** Shown when the nav item isn't the current route. */
  Outline: IconComponent;
  /** Shown when the nav item is the current route. */
  Filled: IconComponent;
}

/** Lucide has no outline/filled distinction — reuse the same glyph for both states (unchanged from before this icon set existed). */
function lucidePair(Icon: LucideIcon): IconPair {
  return { Outline: Icon, Filled: Icon };
}

function rasterPair(Icon: ComponentType<RasterIconProps>): IconPair {
  return {
    Outline: ({ className }) => <Icon className={className} variant="outline" />,
    Filled: ({ className }) => <Icon className={className} variant="filled" />,
  };
}

/**
 * Server Components (route group layouts) can't pass function references
 * (icon components) as props into Client Components (`PortalShell`) — Next
 * serializes the server→client prop boundary and rejects functions. So nav
 * configs carry a string `icon` key instead, and this map (imported only
 * inside client shell components) resolves the key to the actual
 * outline/filled icon pair — outline for an inactive nav row, filled for the
 * active one, per the Purity icon set's outline/filled artwork pairs.
 */
export const SHELL_ICONS = {
  dashboard: rasterPair(HomeIcon),
  schedule: { Outline: CalendarIcon, Filled: CalendarIconFilled },
  patients: { Outline: PersonIcon, Filled: PersonIconFilled },
  billing: { Outline: BillingIcon, Filled: BillingIconFilled },
  settings: rasterPair(SettingsIcon),
  plus: lucidePair(Plus),
  messages: { Outline: ChatIcon, Filled: ChatIconFilled },
  userPlus: lucidePair(UserPlus),
  care: { Outline: ChecklistIcon, Filled: ChecklistIconFilled },
  health: lucidePair(HeartPulse),
  notifications: lucidePair(Bell),
  help: rasterPair(HeadsetIcon),
  wallet: lucidePair(Wallet),
} satisfies Record<string, IconPair>;

export type ShellIconKey = keyof typeof SHELL_ICONS;
