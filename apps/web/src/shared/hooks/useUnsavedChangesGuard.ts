import { useEffect } from "react";

export function useUnsavedChangesGuard(isDirty: boolean) {
  // Block browser close / tab close
  useEffect(() => {
    if (!isDirty) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // Block browser back/forward navigation
  useEffect(() => {
    if (!isDirty) return;

    window.history.pushState(null, "", window.location.href);

    const handlePopState = () => {
      const confirmed = window.confirm("Você tem alterações não salvas. Deseja sair mesmo assim?");
      if (!confirmed) {
        window.history.pushState(null, "", window.location.href);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isDirty]);
}
