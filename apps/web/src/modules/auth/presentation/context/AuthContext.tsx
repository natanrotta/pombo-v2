import { useCallback, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import i18n from "@/shared/i18n";
import { setAuthExpiredHandler } from "@/core/http/httpClient";
import { ROUTE_PATHS } from "@/app/router/RoutePaths";
import type {
  AuthUser,
  SignInInput,
  SignUpInput,
  GoogleSignInInput,
  UpdateProfileInput,
  RequestPasswordResetInput,
  ResetPasswordInput,
} from "@/modules/auth/domain/entities/AuthUser";
import { repositories } from "@/core/di/repositories";
import { AuthContext } from "@/modules/auth/presentation/context/authContextValue";
import type { AuthContextValue } from "@/modules/auth/presentation/context/authContextValue";

const repo = repositories.auth;

export function AuthProvider({ children }: PropsWithChildren) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setAuthExpiredHandler(() => {
      setUser(null);
      // Wipe every TanStack Query cache entry — the next user (or the same
      // user after a token refresh) must never inherit the previous session's
      // data.
      queryClient.clear();
      navigate(ROUTE_PATHS.signIn, { replace: true });
    });
  }, [navigate, queryClient]);

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      try {
        const currentUser = await repo.getCurrentUser();

        if (isMounted) {
          setUser(currentUser);
          if (currentUser?.language) {
            void i18n.changeLanguage(currentUser.language);
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const signIn = useCallback(async (input: SignInInput) => {
    setIsSubmitting(true);

    try {
      const session = await repo.signIn(input);
      setUser(session.user);
      if (session.user.language) {
        void i18n.changeLanguage(session.user.language);
      }
      return session;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const signUp = useCallback(async (input: SignUpInput) => {
    setIsSubmitting(true);

    try {
      // Email+password signup is unverified — no session is set here. The
      // user confirms the PIN at /verify-email, which then sets the session
      // via verifyEmailPin.
      return await repo.signUp(input);
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const sendVerificationPin = useCallback(async () => {
    await repo.sendVerificationPin();
  }, []);

  const discardEmailVerification = useCallback(() => {
    repo.discardEmailVerification();
  }, []);

  const verifyEmailPin = useCallback(async (pin: string) => {
    setIsSubmitting(true);

    try {
      const session = await repo.verifyEmailPin(pin);
      setUser(session.user);
      if (session.user.language) {
        void i18n.changeLanguage(session.user.language);
      }
      return session;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const signInWithGoogle = useCallback(async (input: GoogleSignInInput) => {
    setIsSubmitting(true);

    try {
      const session = await repo.signInWithGoogle(input);
      setUser(session.user);
      if (session.user.language) {
        void i18n.changeLanguage(session.user.language);
      }
      return session;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const updateProfile = useCallback(async (input: UpdateProfileInput) => {
    const updatedUser = await repo.updateProfile(input);
    setUser(updatedUser);
  }, []);

  const uploadAvatar = useCallback(async (file: File) => {
    const updatedUser = await repo.uploadAvatar(file);
    setUser(updatedUser);
  }, []);

  const requestPasswordReset = useCallback(async (input: RequestPasswordResetInput) => {
    await repo.requestPasswordReset(input);
  }, []);

  const resetPassword = useCallback(async (input: ResetPasswordInput) => {
    await repo.resetPassword(input);
  }, []);

  const refreshUser = useCallback(async () => {
    const currentUser = await repo.getCurrentUser();
    setUser(currentUser);
    if (currentUser?.language) {
      void i18n.changeLanguage(currentUser.language);
    }
    return currentUser;
  }, []);

  const signOut = useCallback(async () => {
    setIsSubmitting(true);

    try {
      await repo.signOut();
      setUser(null);
      // Wipe every TanStack Query cache entry so the next signed-in user never
      // inherits the previous user's cached data.
      queryClient.clear();
    } finally {
      setIsSubmitting(false);
    }
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      isSubmitting,
      signIn,
      signUp,
      sendVerificationPin,
      verifyEmailPin,
      discardEmailVerification,
      signInWithGoogle,
      signOut,
      refreshUser,
      updateProfile,
      uploadAvatar,
      requestPasswordReset,
      resetPassword,
    }),
    [
      isLoading,
      isSubmitting,
      signIn,
      signUp,
      sendVerificationPin,
      verifyEmailPin,
      discardEmailVerification,
      signInWithGoogle,
      signOut,
      refreshUser,
      updateProfile,
      uploadAvatar,
      requestPasswordReset,
      resetPassword,
      user,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
