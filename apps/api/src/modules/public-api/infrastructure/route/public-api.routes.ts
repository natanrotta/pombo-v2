import { Router } from "express";
import { container } from "tsyringe";
import { PublicApiController } from "../controller/public-api.controller";
import { validateRequest, asyncHandler } from "@core/http/middlewares";
import { apiTokenAuthMiddleware } from "../middleware/api-token-auth.middleware";
import { apiTokenRateLimit } from "../middleware/api-token-rate-limit.middleware";
import {
  SendTextPublicDTOSchema,
  SendImagePublicDTOSchema,
  SendAudioPublicDTOSchema,
  SendVideoPublicDTOSchema,
  SendDocumentPublicDTOSchema,
  PublicDeviceIdParamSchema,
} from "@modules/public-api/application/dto/public-message.dto";

const publicApiRoutes = Router();
const publicApiController = container.resolve(PublicApiController);

// Every public route: authenticate the pmb_ token first, then a per-token rate
// limit. (CSRF is skipped — these routes are mounted before csrfProtection.)
publicApiRoutes.use(apiTokenAuthMiddleware());
publicApiRoutes.use(apiTokenRateLimit);

publicApiRoutes.get(
  "/devices",
  asyncHandler(publicApiController.listDevices.bind(publicApiController)),
);

// Idempotency-Key header is optional here (generated when absent); 202 =
// accepted + socket alive, NOT delivered.
publicApiRoutes.post(
  "/devices/:deviceId/send-text",
  validateRequest({
    params: PublicDeviceIdParamSchema,
    body: SendTextPublicDTOSchema,
  }),
  asyncHandler(publicApiController.sendText.bind(publicApiController)),
);

publicApiRoutes.post(
  "/devices/:deviceId/send-image",
  validateRequest({
    params: PublicDeviceIdParamSchema,
    body: SendImagePublicDTOSchema,
  }),
  asyncHandler(publicApiController.sendImage),
);
publicApiRoutes.post(
  "/devices/:deviceId/send-audio",
  validateRequest({
    params: PublicDeviceIdParamSchema,
    body: SendAudioPublicDTOSchema,
  }),
  asyncHandler(publicApiController.sendAudio),
);
publicApiRoutes.post(
  "/devices/:deviceId/send-video",
  validateRequest({
    params: PublicDeviceIdParamSchema,
    body: SendVideoPublicDTOSchema,
  }),
  asyncHandler(publicApiController.sendVideo),
);
publicApiRoutes.post(
  "/devices/:deviceId/send-document",
  validateRequest({
    params: PublicDeviceIdParamSchema,
    body: SendDocumentPublicDTOSchema,
  }),
  asyncHandler(publicApiController.sendDocument),
);

export { publicApiRoutes };
