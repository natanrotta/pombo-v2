import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// Single source of truth for "scroll to an in-page section, even if the user
// is on a different route". Consumed by Header and Footer. Without this the
// same branch + navigate("/#${id}") logic was duplicated in two places.
export const useSiteNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const goTo = useCallback(
    (id: string) => {
      if (location.pathname !== "/") {
        navigate(`/#${id}`);
        return;
      }
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [location.pathname, navigate]
  );

  return { goTo };
};
