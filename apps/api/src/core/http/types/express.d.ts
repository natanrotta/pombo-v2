import { Logger } from "pino";

declare global {
  namespace Express {
    interface Request {
      log: Logger;
      locale: string;
      /**
       * Session auth context, set by `authMiddleware()`. Single-user
       * pombo: bound to a `userId` only.
       */
      auth: {
        userId: string;
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
    }
  }
}
