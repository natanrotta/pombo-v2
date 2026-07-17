import { z } from "zod";

export const RegisterDeviceDTOSchema = z.object({
  name: z.string().trim().min(1).max(100),
  webhookUrl: z.string().url().optional(),
});

export const DeviceIdParamSchema = z.object({
  id: z.string().uuid("Invalid device ID format"),
});

export type RegisterDeviceDTO = z.infer<typeof RegisterDeviceDTOSchema>;
export type DeviceIdParam = z.infer<typeof DeviceIdParamSchema>;

/** Returned exactly once at registration — carries the one-time webhookSecret. */
export interface RegisterDeviceResponseDTO {
  id: string;
  webhookSecret: string;
}
