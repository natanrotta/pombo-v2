/**
 * Port for wiping a device's persisted authState (the Signal keys). Used on a
 * terminal logout: the pairing is gone, so the stored creds/keys must be
 * cleared so the next connect starts a fresh pairing. Separate from the
 * AuthenticationState factory (prisma-auth-state.ts) because "clear on logout"
 * is a lifecycle operation the application owns, testable with an in-memory
 * double — while the socket adapter stays thin.
 */
export interface IAuthStateRepository {
  clear(deviceId: string): Promise<void>;
}
