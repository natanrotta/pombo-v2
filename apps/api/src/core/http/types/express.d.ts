import { Logger } from "pino";

declare global {
  namespace Express {
    interface Request {
      log: Logger;
      locale: string;
      /**
       * Session auth context, set by `authMiddleware()`. Carries the user and
       * the tenant (`accountId`) every owned-resource query scopes by (R1).
       */
      auth: {
        userId: string;
        accountId: string;
        language: string;
        /**
         * Capability scope when the request was authenticated with a
         * narrow-purpose token. Undefined for the standard full-access JWT.
         */
        scope?: string;
      };
      /**
       * Set by `emailVerificationAuthMiddleware()` on the send/verify-PIN
       * routes. Carries only the user id decoded from the `email:verify`
       * scoped token.
       */
      emailVerifyAuth?: {
        userId: string;
      };
      /**
       * Public-API auth context, set by `apiTokenAuthMiddleware()` on the
       * `/api/v1/*` routes. Carries the account the `pmb_` token belongs to
       * (every query scopes by it) and the token id (rate-limit key + last-used
       * stamp). Present ONLY on the public surface.
       */
      apiAuth?: {
        accountId: string;
        tokenId: string;
      };
    }
  }
}
