import type {
  AuthSession,
  AuthUser,
  SignInInput,
  SignUpInput,
  SignUpResult,
  GoogleSignInInput,
  UpdateProfileInput,
  RequestPasswordResetInput,
  ResetPasswordInput,
} from "@/modules/auth/domain/entities/AuthUser";

export interface AuthRepository {
  /** Single-user sign-in — returns the authenticated session directly. */
  signIn(input: SignInInput): Promise<AuthSession>;
  /** Email+password signup. The account starts unverified — instead of a
   *  session this stores a scoped token and returns the registered e-mail so
   *  the caller routes to `/verify-email`. */
  signUp(input: SignUpInput): Promise<SignUpResult>;
  /** Sends (or resends) the 6-digit confirmation PIN to the unverified
   *  user's e-mail. Authenticated by the scoped token from `signUp`. */
  sendVerificationPin(): Promise<void>;
  /** Confirms the PIN and upgrades the scoped token into a full session. */
  verifyEmailPin(pin: string): Promise<AuthSession>;
  /** Discards the scoped email-verify token when the user abandons the flow. */
  discardEmailVerification(): void;
  signInWithGoogle(input: GoogleSignInInput): Promise<AuthSession>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<AuthUser | null>;
  updateProfile(input: UpdateProfileInput): Promise<AuthUser>;
  uploadAvatar(file: File): Promise<AuthUser>;
  requestPasswordReset(input: RequestPasswordResetInput): Promise<void>;
  resetPassword(input: ResetPasswordInput): Promise<void>;
}
