import { useCallback, useMemo, useState, type PropsWithChildren } from "react";
import { SidebarContext } from "@/shared/contexts/sidebarContextValue";
import { STORAGE_KEYS } from "@/shared/constants/storageKeys";

function getInitialState(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.sidebarCollapsed) === "true";
  } catch {
    return false;
  }
}

export function SidebarProvider({ children }: PropsWithChildren) {
  const [isCollapsed, setIsCollapsed] = useState(getInitialState);

  const toggleSidebar = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEYS.sidebarCollapsed, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const value = useMemo(() => ({ isCollapsed, toggleSidebar }), [isCollapsed, toggleSidebar]);

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}
