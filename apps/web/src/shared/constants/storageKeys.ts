export const STORAGE_KEYS = {
  language: "@pombo-web:language",
  sidebarCollapsed: "sidebar-collapsed",
  /** Scoped `email:verify` token held during the (pre-session) signup flow.
   *  Kept in **sessionStorage** (survives a same-tab refresh of /verify-email,
   *  clears on tab close) and sent as a Bearer ONLY on /auth/email-verification/*
   *  requests — see httpClient. The real session never uses this; it lives in
   *  the httpOnly access cookie. */
  emailVerifyToken: "@pombo-web:email-verify-token",
} as const;
