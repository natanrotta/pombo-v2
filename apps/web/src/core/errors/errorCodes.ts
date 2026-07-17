/**
 * Error codes the frontend explicitly branches on.
 *
 * This is NOT a mirror of the entire backend `ErrorCodes` catalog (apps/api
 * src/shared/errors/error-codes.ts). The backend emits ~110 codes; the
 * frontend only needs typed constants for the ones it actively switches on
 * (auth refresh, validation toasts, copilot SSE handling, etc.).
 *
 * Add a code here only when the UI needs to make a decision based on it.
 * `AppError.code` stays typed as `string` so unknown backend codes do not
 * crash the client — they just fall through to the generic error toast.
 */
export const ErrorCodes = {
  // Transport / auth — used by the axios refresh interceptor
  AUTH_TOKEN_EXPIRED: "AUTH_TOKEN_EXPIRED",
  AUTH_TOKEN_INVALID: "AUTH_TOKEN_INVALID",
  AUTH_TOKEN_REVOKED: "AUTH_TOKEN_REVOKED",

  // Form / validation — used by useNotify to surface field-level details
  VALIDATION_ERROR: "VALIDATION_ERROR",

  // Copilot SSE — used by CopilotContext to render the "buy more tokens" CTA
  INSUFFICIENT_TOKENS: "INSUFFICIENT_TOKENS",
  COPILOT_RATE_LIMITED: "COPILOT_RATE_LIMITED",
  COPILOT_TIMEOUT: "COPILOT_TIMEOUT",
  COPILOT_INTERNAL_ERROR: "COPILOT_INTERNAL_ERROR",
  COPILOT_NO_TRANSCRIPTION: "COPILOT_NO_TRANSCRIPTION",
  COPILOT_NO_TEMPLATE_FIELDS: "COPILOT_NO_TEMPLATE_FIELDS",

  // Generic transport
  RATE_LIMIT: "RATE_LIMIT",
  AI_RATE_LIMIT: "AI_RATE_LIMIT",
  AUTH_RATE_LIMIT: "AUTH_RATE_LIMIT",
  NOT_FOUND: "NOT_FOUND",

  // Workplace join-by-code — used by JoinWorkplaceByCodeModal to map BE
  // errors to friendly copy ("código inválido" vs. "já é membro").
  WORKPLACE_NOT_FOUND: "WORKPLACE_NOT_FOUND",
  INVITE_ALREADY_MEMBER: "INVITE_ALREADY_MEMBER",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
