import { z } from "zod";

// E.164: an optional leading +, a non-zero first digit, 8–15 digits total.
const E164 = /^\+?[1-9]\d{7,14}$/;

export const SendTextPublicDTOSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(E164, "phone must be in E.164 format (e.g. 5548999999999)"),
  message: z.string().trim().min(1).max(4096),
});

export const PublicDeviceIdParamSchema = z.object({
  deviceId: z.string().uuid("Invalid device ID format"),
});

export type SendTextPublicDTO = z.infer<typeof SendTextPublicDTOSchema>;
export type PublicDeviceIdParam = z.infer<typeof PublicDeviceIdParamSchema>;
