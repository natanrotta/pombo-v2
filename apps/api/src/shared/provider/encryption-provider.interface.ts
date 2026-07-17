/**
 * Domain port for symmetric encryption of short secrets (e.g. provider
 * access tokens persisted in Postgres). Lets the application layer wrap +
 * unwrap secrets without depending on a concrete crypto library. The
 * canonical implementation today is AES-256-GCM (see
 * `infrastructure/services/aes-gcm-encryption.service.ts`), but the
 * contract leaves the algorithm and key-version policy as an
 * implementation concern.
 */
export interface IEncryptionProvider {
  /** Encrypt + base64-encode a UTF-8 plaintext. */
  encrypt(plaintext: string): string;
  /** Reverse of `encrypt`. Throws on auth-tag mismatch / malformed input. */
  decrypt(payload: string): string;
}
