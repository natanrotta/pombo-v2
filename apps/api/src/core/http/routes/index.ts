import { Router } from "express";
import { authRoutes } from "@modules/auth/infrastructure/route/auth.routes";
import { userRoutes } from "@modules/user/infrastructure/route/user.routes";
import { deviceRoutes } from "@modules/devices/infrastructure/route/device.routes";
import { messageRoutes } from "@modules/messaging/infrastructure/route/message.routes";
import { getGatewayHealth } from "@modules/devices/infrastructure/health/gateway-health";
import { userRateLimit } from "../middlewares";
import { container, DI_TOKENS } from "@core/container";

const router = Router();

// Resolved once from the container. The CI stamps APP_VERSION (the git sha)
// into the image; the deploy workflow reads this back to confirm the expected
// version actually went live ("unknown" when built outside the CI).
const apiVersion = container.resolve<string>(DI_TOKENS.ApiVersion);

// Unauthenticated health probe. With WHATSAPP_ENABLED=false the API reports
// healthy without touching WhatsApp; when enabled it aggregates the registered
// devices (503 if any is not CONNECTED).
router.get("/health", async (_req, res) => {
  const gateway = await getGatewayHealth();
  const status = gateway?.status === "degraded" ? 503 : 200;
  return res.status(status).json({
    ok: status === 200,
    version: apiVersion,
    uptimeSeconds: Math.round(process.uptime()),
    ...(gateway ? { gateway } : {}),
  });
});

router.use("/auth", authRoutes);

router.use(userRateLimit);

// User management (CRUD) — every route is auth-guarded inside user.routes.
router.use("/users", userRoutes);

// WhatsApp gateway (pombo) — devices + messaging. Every route is JWT-guarded
// inside its own router. Device management under /devices; the send + status
// routes (/devices/:id/messages, /messages/:id) mount at root.
router.use("/devices", deviceRoutes);
router.use(messageRoutes);

export { router };
