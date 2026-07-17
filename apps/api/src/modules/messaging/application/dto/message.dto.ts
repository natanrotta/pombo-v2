import { z } from "zod";

export const SendMessageDTOSchema = z.object({
  phone: z.string().trim().min(5),
  text: z.string().trim().min(1),
});

export const SendMessageParamSchema = z.object({
  id: z.string().uuid("Invalid device ID format"),
});

export const MessageIdParamSchema = z.object({
  id: z.string().uuid("Invalid message ID format"),
});

export type SendMessageDTO = z.infer<typeof SendMessageDTOSchema>;
export type SendMessageParam = z.infer<typeof SendMessageParamSchema>;
export type MessageIdParam = z.infer<typeof MessageIdParamSchema>;

/** Input carried into the send use case. `accountId` (tenant scope) + device id
 *  + idempotency key are added by the controller from `req.auth`, the route and
 *  the header. */
export interface SendTextInput {
  accountId: string;
  deviceId: string;
  phone: string;
  text: string;
  idempotencyKey: string;
}
