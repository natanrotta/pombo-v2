import { Router } from "express";
import { authRoutes } from "@modules/auth/infrastructure/route/auth.routes";
import { userRoutes } from "@modules/user/infrastructure/route/user.routes";
import { userRateLimit } from "../middlewares";
import { container, DI_TOKENS } from "@core/container";

const router = Router();

// Resolved once from the container. The CI stamps APP_VERSION (the git sha)
// into the image; the deploy workflow reads this back to confirm the expected
// version actually went live ("unknown" when built outside the CI).
const apiVersion = container.resolve<string>(DI_TOKENS.ApiVersion);

// Unauthenticated health probe.
router.get("/health", (_req, res) => {
  return res.status(200).json({
    ok: true,
    version: apiVersion,
    uptimeSeconds: Math.round(process.uptime()),
  });
});

router.use("/auth", authRoutes);

router.use(userRateLimit);

// User management (CRUD) — every route is auth-guarded inside user.routes.
router.use("/users", userRoutes);

export { router };
