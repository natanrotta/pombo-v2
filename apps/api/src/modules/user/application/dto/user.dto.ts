import { z } from "zod";
import type { UserResponseDTO } from "@pombo/shared-types";

export type { UserResponseDTO };

export const CreateUserDTOSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  status: z.enum(["ACTIVE", "PENDING"]).optional(),
});

export const UpdateUserDTOSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  status: z.enum(["ACTIVE", "PENDING"]).optional(),
});

export const UserIdParamSchema = z.object({
  id: z.string().uuid("Invalid user ID format"),
});

export type CreateUserDTO = z.infer<typeof CreateUserDTOSchema>;
export type UpdateUserDTO = z.infer<typeof UpdateUserDTOSchema>;
export type UserIdParam = z.infer<typeof UserIdParamSchema>;
