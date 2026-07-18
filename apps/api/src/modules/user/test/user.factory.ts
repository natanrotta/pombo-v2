import { User, UserProps } from "@modules/user/domain/entity/user.entity";

let seq = 0;

export function makeUser(overrides: Partial<UserProps> = {}): User {
  seq++;
  return new User({
    id: `user-${seq}`,
    accountId: `account-${seq}`,
    name: `User ${seq}`,
    email: `user${seq}@test.com`,
    password: "hashed-password",
    googleId: null,
    status: "ACTIVE",
    emailVerified: true,
    avatarUrl: null,
    language: "pt-BR",
    tokenVersion: 0,
    tokenExpiresAt: null,
    refreshTokenHash: null,
    refreshTokenExpiresAt: null,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    deletedAt: null,
    ...overrides,
  });
}
