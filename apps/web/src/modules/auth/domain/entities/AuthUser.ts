/**
 * Single-user auth model for the boilerplate. There are no accounts,
 * memberships, onboarding, or subscription concepts here — just the
 * authenticated user and the inputs the auth flows need.
 */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  /** Whether the user confirmed control of their e-mail. Always true for a
   *  logged-in user reaching the app (the `/verify-email` gate flips it
   *  before a full session is issued). */
  emailVerified: boolean;
  avatarUrl: string;
  language: string;
}

/**
 * A completed sign-in. The session credential itself is the httpOnly
 * access cookie set by the server — JS never sees or stores the JWT,
 * so the session carries only the authenticated user.
 */
export interface AuthSession {
  user: AuthUser;
}

export interface SignInInput {
  email: string;
  password: string;
}

export interface SignUpInput {
  name: string;
  email: string;
  password: string;
  /** UI locale at signup time. Persisted as `user.language`. Falls back to
   *  the backend default when omitted. */
  language?: string;
}

/** Returned by `signUp`. The account is created unverified — the caller
 *  routes the user to `/verify-email` to confirm the PIN. */
export interface SignUpResult {
  kind: "verify-email";
  email: string;
}

export interface GoogleSignInInput {
  credential: string;
  /** Same semantics as SignUpInput.language. */
  language?: string;
}

export interface RequestPasswordResetInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  password: string;
}

export interface UpdateProfileInput {
  name?: string;
  email?: string;
  language?: string;
}
