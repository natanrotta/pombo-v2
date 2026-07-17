import { createContext } from "react";
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

export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSubmitting: boolean;
  /** Single-user sign-in — resolves to the authenticated session. */
  signIn: (input: SignInInput) => Promise<AuthSession>;
  /** Email+password signup. Creates an unverified account and returns the
   *  registered e-mail; the caller routes to `/verify-email`. Does NOT set a
   *  session — that happens after `verifyEmailPin`. */
  signUp: (input: SignUpInput) => Promise<SignUpResult>;
  /** Sends/resends the e-mail-confirmation PIN to the unverified user. */
  sendVerificationPin: () => Promise<void>;
  /** Confirms the PIN, sets the session, and returns it. */
  verifyEmailPin: (pin: string) => Promise<AuthSession>;
  /** Discards the scoped email-verify token when the user abandons the flow. */
  discardEmailVerification: () => void;
  signInWithGoogle: (input: GoogleSignInInput) => Promise<AuthSession>;
  signOut: () => Promise<void>;
  /** Re-fetches the current user from the server and updates context state. */
  refreshUser: () => Promise<AuthUser | null>;
  updateProfile: (input: UpdateProfileInput) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
  requestPasswordReset: (input: RequestPasswordResetInput) => Promise<void>;
  resetPassword: (input: ResetPasswordInput) => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
