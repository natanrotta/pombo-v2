import { FiHome, FiSettings } from "@/shared/components/icons";
import type { IconType } from "@/shared/components/icons";
import { ROUTE_PATHS } from "@/app/router/RoutePaths";

export interface NavigationItem {
  labelKey: string;
  to: string;
  icon: IconType;
}

export interface NavigationSection {
  labelKey: string;
  items: NavigationItem[];
}

export const navigationSections: NavigationSection[] = [
  {
    labelKey: "nav.sections.main",
    items: [
      {
        labelKey: "nav.dashboard",
        to: ROUTE_PATHS.dashboard,
        icon: FiHome,
      },
      {
        labelKey: "nav.settings",
        to: ROUTE_PATHS.settings,
        icon: FiSettings,
      },
    ],
  },
];

export const navigationItems = navigationSections.flatMap((section) => section.items);
