export * from "./auth.js";
export * from "./user.js";

// Runtime values — re-exported explicitly so Vite's CommonJS lexer can
// statically resolve the named export without traversing the
// `__exportStar(require(...))` chain. Type-only re-exports above don't need
// this because they vanish at compile time.
export { EMAIL_VERIFY_JWT_SCOPE } from "./auth.js";
