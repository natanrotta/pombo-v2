/**
 * Lifecycle of a `user` row. Mirrors the Prisma `user_status` enum so the
 * DTO and the entity speak the same vocabulary as the database.
 */
export const UserStatus = {
  ACTIVE: "ACTIVE",
  PENDING: "PENDING",
} as const;

export type UserStatusType = (typeof UserStatus)[keyof typeof UserStatus];
