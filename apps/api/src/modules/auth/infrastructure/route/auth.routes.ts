import { Router } from "express";
import { container } from "tsyringe";
import { AuthController } from "../controller/auth.controller";
import {
  validateRequest,
  asyncHandler,
  authMiddleware,
  emailVerificationAuthMiddleware,
  authRateLimit,
} from "@core/http/middlewares";
import { uploadImage } from "@core/http/middlewares/upload.middleware";
import {
  SignInDTOSchema,
  SignUpDTOSchema,
  RefreshTokenDTOSchema,
  UpdateProfileDTOSchema,
  GoogleSignInDTOSchema,
  RequestPasswordResetDTOSchema,
  ResetPasswordDTOSchema,
  VerifyEmailPinDTOSchema,
} from "@modules/auth/application/dto/auth.dto";

const authRoutes = Router();
const authController = container.resolve(AuthController);

authRoutes.post(
  "/sign-up",
  authRateLimit,
  validateRequest({ body: SignUpDTOSchema }),
  asyncHandler(authController.signUp.bind(authController)),
);

authRoutes.post(
  "/sign-in",
  authRateLimit,
  validateRequest({ body: SignInDTOSchema }),
  asyncHandler(authController.signIn.bind(authController)),
);

authRoutes.post(
  "/google",
  authRateLimit,
  validateRequest({ body: GoogleSignInDTOSchema }),
  asyncHandler(authController.googleSignIn.bind(authController)),
);

authRoutes.post(
  "/password/request-reset",
  authRateLimit,
  validateRequest({ body: RequestPasswordResetDTOSchema }),
  asyncHandler(authController.requestPasswordReset.bind(authController)),
);

authRoutes.post(
  "/password/reset",
  authRateLimit,
  validateRequest({ body: ResetPasswordDTOSchema }),
  asyncHandler(authController.resetPassword.bind(authController)),
);

authRoutes.post(
  "/refresh",
  authRateLimit,
  validateRequest({ body: RefreshTokenDTOSchema }),
  asyncHandler(authController.refresh.bind(authController)),
);

// E-mail confirmation (PIN) — accept ONLY the `email:verify`-scoped token
// issued at sign-up. Rate-limited like the rest of the auth surface; the
// use cases enforce the resend cooldown + brute-force lockout on top.
authRoutes.post(
  "/email-verification/send",
  authRateLimit,
  emailVerificationAuthMiddleware(),
  asyncHandler(authController.sendEmailVerificationPin.bind(authController)),
);

authRoutes.post(
  "/email-verification/verify",
  authRateLimit,
  emailVerificationAuthMiddleware(),
  validateRequest({ body: VerifyEmailPinDTOSchema }),
  asyncHandler(authController.verifyEmailPin.bind(authController)),
);

authRoutes.post(
  "/sign-out",
  authMiddleware(),
  asyncHandler(authController.signOut.bind(authController)),
);

authRoutes.get(
  "/me",
  authMiddleware(),
  asyncHandler(authController.me.bind(authController)),
);

authRoutes.put(
  "/profile",
  authMiddleware(),
  validateRequest({ body: UpdateProfileDTOSchema }),
  asyncHandler(authController.updateProfile.bind(authController)),
);

authRoutes.put(
  "/profile/avatar",
  authMiddleware(),
  // SEC-H2: file upload — cap it. `authRoutes` mounts before the global limiter.
  authRateLimit,
  uploadImage,
  asyncHandler(authController.updateAvatar.bind(authController)),
);

authRoutes.delete(
  "/account",
  authMiddleware(),
  asyncHandler(authController.deleteAccount.bind(authController)),
);

export { authRoutes };
