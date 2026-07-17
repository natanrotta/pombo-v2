export interface EmailVerificationPin {
  id: string;
  userId: string;
  pinHash: string;
  expiresAt: Date;
  /** Wrong-PIN attempts so far. Drives the brute-force lockout. */
  attempts: number;
  usedAt: Date | null;
  createdAt: Date;
}

export interface CreateEmailVerificationPinData {
  userId: string;
  pinHash: string;
  expiresAt: Date;
}

export interface IEmailVerificationPinRepository {
  create(data: CreateEmailVerificationPinData): Promise<EmailVerificationPin>;
  /** Latest unused PIN for the user (the only one that can be valid — resend
   *  hard-deletes the previous rows). Returns null when none is outstanding. */
  findActiveByUserId(userId: string): Promise<EmailVerificationPin | null>;
  /** Atomically bumps `attempts` and returns the new count — used by the
   *  brute-force gate so two concurrent verifies cannot both read the old
   *  count and bypass the cap. */
  incrementAttempts(id: string): Promise<number>;
  markAsUsed(id: string): Promise<void>;
  /** Drops every unused PIN for the user. Called before issuing a new one so
   *  only the latest code is ever accepted. */
  deleteUnusedForUser(userId: string): Promise<void>;
}
