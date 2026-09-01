import {
  LayoutGrid,
  CalendarDays,
  Users,
  Receipt,
  Settings,
  Plus,
  MessagesSquare,
  UserPlus,
  ClipboardList,
  HeartPulse,
  Bell,
  LifeBuoy,
  Wallet,
  type LucideIcon,
} from "lucide-react";

/**
 * Server Components (route group layouts) can't pass function references
 * (icon components) as props into Client Components (`PortalShell`) — Next
 * serializes the server→client prop boundary and rejects functions. So nav
 * configs carry a string `icon` key instead, and this map (imported only
 * inside client shell components) resolves the key to the actual icon.
 */
export const SHELL_ICONS = {
  dashboard: LayoutGrid,
  schedule: CalendarDays,
  patients: Users,
  billing: Receipt,
  settings: Settings,
  plus: Plus,
  messages: MessagesSquare,
  userPlus: UserPlus,
  care: ClipboardList,
  health: HeartPulse,
  notifications: Bell,
  help: LifeBuoy,
  wallet: Wallet,
} satisfies Record<string, LucideIcon>;

export type ShellIconKey = keyof typeof SHELL_ICONS;
