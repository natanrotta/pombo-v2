import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  CipherGCM,
  DecipherGCM,
} from "node:crypto";
import { inject, injectable } from "tsyringe";
import { DI_TOKENS } from "@core/container/tokens";
import { IEncryptionProvider } from "@shared/provider/encryption-provider.interface";
import { InternalError } from "@shared/error";

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12; // GCM standard nonce size — 96 bits
const TAG_BYTES = 16; // GCM auth tag — 128 bits
const KEY_BYTES = 32; // AES-256

export interface AesGcmConfig {
  /**
   * Raw 32-byte key. The container resolves this from the Zod-validated env
   * `SIGNATURE_SESSION_ENCRYPTION_KEY` (Base64 of 32 bytes).
   */
  key: Buffer;
}

/**
 * AES-256-GCM wrapper used to encrypt the digital-signature provider
 * access tokens before they hit Postgres. The output format packs the IV
 * and the GCM auth tag into the same Base64 string so the persistence
 * layer only needs one column:
 *
 *   Base64( iv(12) || authTag(16) || ciphertext )
 *
 * Rotation strategy (out of Fase 1 scope): the format leaves room for a
 * version byte; today we store `[iv|tag|ciphertext]` with no version
 * prefix. If we ever need rotation, the migration is to prefix new rows
 * with `0x01` + key id and decode accordingly.
 */
@injectable()
export class AesGcmEncryptionService implements IEncryptionProvider {
  private readonly key: Buffer;

  constructor(@inject(DI_TOKENS.AesGcmEncryptionConfig) config: AesGcmConfig) {
    if (config.key.length !== KEY_BYTES) {
      throw new InternalError(
        `AES-GCM encryption key must be ${KEY_BYTES} bytes; got ${config.key.length}`,
      );
    }
    this.key = config.key;
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv(ALGORITHM, this.key, iv) as CipherGCM;
    const ciphertext = Buffer.concat([
      cipher.update(plaintext, "utf8"),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, ciphertext]).toString("base64");
  }

  decrypt(payload: string): string {
    const raw = Buffer.from(payload, "base64");
    if (raw.length < IV_BYTES + TAG_BYTES + 1) {
      // Persisted ciphertext that cannot even hold iv+tag means data
      // corruption, not caller error — surface as a non-operational 500.
      throw new InternalError("Encrypted payload too short");
    }
    const iv = raw.subarray(0, IV_BYTES);
    const tag = raw.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
    const ciphertext = raw.subarray(IV_BYTES + TAG_BYTES);
    const decipher = createDecipheriv(ALGORITHM, this.key, iv) as DecipherGCM;
    decipher.setAuthTag(tag);
    return Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString("utf8");
  }
}
