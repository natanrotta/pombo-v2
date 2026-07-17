import { Router } from "express";
import { container } from "tsyringe";
import { MessageController } from "../controller/message.controller";
import {
  validateRequest,
  asyncHandler,
  authMiddleware,
} from "@core/http/middlewares";
import {
  SendMessageDTOSchema,
  SendMessageParamSchema,
  MessageIdParamSchema,
} from "@modules/messaging/application/dto/message.dto";

const messageRoutes = Router();
const messageController = container.resolve(MessageController);

// Every messaging route requires an authenticated session (JWT).
messageRoutes.use(authMiddleware());

// The Idempotency-Key header is validated in the controller (validateRequest
// covers params/query/body only). 202 = accepted + socket alive, NOT delivered.
messageRoutes.post(
  "/devices/:id/messages",
  validateRequest({
    params: SendMessageParamSchema,
    body: SendMessageDTOSchema,
  }),
  asyncHandler(messageController.send.bind(messageController)),
);

messageRoutes.get(
  "/messages/:id",
  validateRequest({ params: MessageIdParamSchema }),
  asyncHandler(messageController.getStatus.bind(messageController)),
);

export { messageRoutes };
