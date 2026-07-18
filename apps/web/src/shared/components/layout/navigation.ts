import { FiCode, FiSend, FiSmartphone, FiUser } from "@/shared/components/icons";
import type { IconType } from "@/shared/components/icons";
import { ROUTE_PATHS } from "@/app/router/RoutePaths";

export interface NavigationItem {
  labelKey: string;
  to: string;
  icon: IconType;
}

/** A group of nav items. The sidebar renders the items only — the group has no
 *  visible header. */
export interface NavigationSection {
  items: NavigationItem[];
}

export const navigationSections: NavigationSection[] = [
  {
    items: [
      {
        labelKey: "nav.devices",
        to: ROUTE_PATHS.devices,
        icon: FiSmartphone,
      },
      {
        labelKey: "nav.sandbox",
        to: ROUTE_PATHS.sandbox,
        icon: FiSend,
      },
      {
        labelKey: "nav.profile",
        to: ROUTE_PATHS.profile,
        icon: FiUser,
      },
      {
        labelKey: "nav.api",
        to: ROUTE_PATHS.api,
        icon: FiCode,
      },
    ],
  },
];
