import { Building2, Rocket, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Generic 3-tier demo pricing. Copy lives in the locale files under
// `pricing.plans.<kind>`; edit the numbers below and the copy there to match
// your product. `total` is the headline price used by the count-up animation.
export type PlanKind = "starter" | "pro" | "enterprise";

export type Plan = {
  id: string;
  kind: PlanKind;
  icon: LucideIcon;
  currency: string;
  subtotal: number;
  total: number;
  featured?: boolean;
};

export const PLANS: Plan[] = [
  {
    id: "0000001",
    kind: "starter",
    icon: Rocket,
    currency: "$",
    subtotal: 9,
    total: 9,
  },
  {
    id: "0000002",
    kind: "pro",
    icon: Zap,
    currency: "$",
    subtotal: 29,
    total: 29,
    featured: true,
  },
  {
    id: "0000003",
    kind: "enterprise",
    icon: Building2,
    currency: "$",
    subtotal: 99,
    total: 99,
  },
];
