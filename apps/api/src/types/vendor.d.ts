/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Ambient module shims for the (gated) WhatsApp gateway's ESM-only / untyped deps.
 *
 * Why: `apps/api` compiles as CommonJS (`module: node16`, no `"type": "module"`),
 * but `@whiskeysockets/baileys` is a pure-ESM package (`"type": "module"`, no
 * `exports`). Under node16 resolution, statically importing an ESM package from a
 * CJS file raises TS1479/TS1541 (format mismatch) — even though the three files
 * that touch Baileys (`session-manager`, `socket-config`, `prisma-auth-state`)
 * are only reached at runtime via the dynamic `import("./session-manager.js")`
 * inside `BaileysWhatsAppGateway`, bound ONLY when `WHATSAPP_ENABLED=true`. That
 * runtime path is fine (dev: `tsx`/esbuild interop; prod: Node ≥22.12 `require(esm)`).
 *
 * Declaring the symbols we consume as ambient `any` removes the compile-time
 * format check. The gateway is off by default and its behavior is exercised in
 * tests via `FakeWhatsAppGateway`, so type fidelity against the real Baileys API
 * is not load-bearing here. `qrcode-terminal` simply ships no type declarations.
 */
declare module "@whiskeysockets/baileys" {
  export type WASocket = any;
  export type SocketConfig = any;
  export type AuthenticationState = any;
  export type AuthenticationCreds = any;
  // Record<string, any> (not `any`) so `keyof SignalDataTypeMap` stays `string`
  // and template-literal keys don't trip the symbol-coercion check.
  export type SignalDataTypeMap = Record<string, any>;
  export const proto: any;
  export const DisconnectReason: any;
  export const Browsers: any;
  export const BufferJSON: any;
  export function initAuthCreds(): any;
  export function fetchLatestBaileysVersion(): Promise<any>;
  export function jidDecode(jid: any): any;
  const makeWASocket: any;
  export default makeWASocket;
}

declare module "qrcode-terminal";
