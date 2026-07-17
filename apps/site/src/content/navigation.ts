import { CreditCard, LayoutGrid, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Nav items carry only an `id` + `icon`. Labels live in the locale files
// (`nav.<id>`) and are resolved at render time by every consumer.
export type NavItem = {
  id: string;
  icon: LucideIcon;
};

export const PRIMARY_NAV: NavItem[] = [
  { id: "problema", icon: Sparkles },
  { id: "modulos", icon: LayoutGrid },
  { id: "planos", icon: CreditCard },
];

// Placeholder app URL — swap for your product's dashboard/sign-in URL.
export const PLATFORM_URL = "https://app.example.com";
