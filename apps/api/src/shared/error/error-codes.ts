export const ErrorCodes = {
  // Fallback — used when an unknown/uncategorized error bubbles up.
  // Keeps the client response shape stable and gives the error reporter a
  // consistent grouping key.
  GENERIC_ERROR: "GENERIC_ERROR",

  // User
  USER_NOT_FOUND: "USER_NOT_FOUND",

  // Auth
  AUTH_INVALID_CREDENTIALS: "AUTH_INVALID_CREDENTIALS",
  AUTH_TOKEN_EXPIRED: "AUTH_TOKEN_EXPIRED",
  AUTH_TOKEN_INVALID: "AUTH_TOKEN_INVALID",
  AUTH_TOKEN_REVOKED: "AUTH_TOKEN_REVOKED",
  AUTH_NO_TOKEN: "AUTH_NO_TOKEN",
  AUTH_INSUFFICIENT_ROLE: "AUTH_INSUFFICIENT_ROLE",
  AUTH_EMAIL_ALREADY_EXISTS: "AUTH_EMAIL_ALREADY_EXISTS",
  AUTH_GOOGLE_ONLY: "AUTH_GOOGLE_ONLY",
  AUTH_GOOGLE_TOKEN_INVALID: "AUTH_GOOGLE_TOKEN_INVALID",
  AUTH_PASSWORD_RESET_TOKEN_INVALID: "AUTH_PASSWORD_RESET_TOKEN_INVALID",
  AUTH_PASSWORD_RESET_TOKEN_EXPIRED: "AUTH_PASSWORD_RESET_TOKEN_EXPIRED",
  AUTH_PASSWORD_RESET_TOKEN_USED: "AUTH_PASSWORD_RESET_TOKEN_USED",
  /** Wrong e-mail-confirmation PIN. Intentionally vague to avoid leaking how
   *  many digits matched. */
  AUTH_EMAIL_VERIFICATION_PIN_INVALID: "AUTH_EMAIL_VERIFICATION_PIN_INVALID",
  /** PIN expired, never issued, or already consumed — the user must request
   *  a new code. */
  AUTH_EMAIL_VERIFICATION_PIN_EXPIRED: "AUTH_EMAIL_VERIFICATION_PIN_EXPIRED",
  /** Too many wrong attempts (lockout) or a resend requested inside the
   *  cooldown window. */
  AUTH_EMAIL_VERIFICATION_RATE_LIMITED: "AUTH_EMAIL_VERIFICATION_RATE_LIMITED",
  /** The e-mail was already confirmed — the FE should move on to onboarding. */
  AUTH_EMAIL_ALREADY_VERIFIED: "AUTH_EMAIL_ALREADY_VERIFIED",
  /** Sign-in succeeded but the user has no live `account_membership` row —
   *  every account they were ever in revoked them. */
  AUTH_NO_ACTIVE_MEMBERSHIP: "AUTH_NO_ACTIVE_MEMBERSHIP",
  /** select-account / switch-account: the (userId, accountId) pair has no
   *  membership. Either the membership was revoked between sign-in and the
   *  follow-up, or the client supplied a forged accountId. */
  AUTH_MEMBERSHIP_NOT_FOUND: "AUTH_MEMBERSHIP_NOT_FOUND",

  // Patient
  PATIENT_NOT_FOUND: "PATIENT_NOT_FOUND",
  PATIENT_TEMPLATE_NOT_FOUND: "PATIENT_TEMPLATE_NOT_FOUND",
  PATIENT_TEMPLATE_LIMIT_REACHED: "PATIENT_TEMPLATE_LIMIT_REACHED",
  /** A `(patient_id, field_template_id)` pivot row already exists. Emitted
   *  by AddPatientTemplateUseCase as a defense-in-depth remap of the
   *  Prisma P2002 — closes the TOCTOU window between the limit-check
   *  (count read) and the addTemplate (insert). */
  PATIENT_TEMPLATE_ALREADY_LINKED: "PATIENT_TEMPLATE_ALREADY_LINKED",

  // Contact
  CONTACT_NOT_FOUND: "CONTACT_NOT_FOUND",
  CONTACT_RELATION_EXISTS: "CONTACT_RELATION_EXISTS",
  CONTACT_RELATION_NOT_FOUND: "CONTACT_RELATION_NOT_FOUND",

  // Address
  INVALID_COUNTRY_CODE: "INVALID_COUNTRY_CODE",

  // Phone
  /** Phone parts (country_code + national_number) didn't yield a valid E.164
   *  per libphonenumber. Surfaced when the user types a number that fails
   *  region validation. */
  INVALID_PHONE: "INVALID_PHONE",
  /** Another row in the same account already owns this E.164 number. Mapped
   *  from Prisma P2002 on the `@@unique([account_id, e164])` constraint. */
  PHONE_CONFLICT: "PHONE_CONFLICT",

  // Consultation
  CONSULTATION_NOT_FOUND: "CONSULTATION_NOT_FOUND",
  CONSULTATION_TEMPLATE_LIMIT_REACHED: "CONSULTATION_TEMPLATE_LIMIT_REACHED",
  ATTACHMENT_NOT_FOUND: "ATTACHMENT_NOT_FOUND",

  // Tag
  TAG_NOT_FOUND: "TAG_NOT_FOUND",
  TAG_DUPLICATE_NAME: "TAG_DUPLICATE_NAME",

  // Template
  TEMPLATE_NOT_FOUND: "TEMPLATE_NOT_FOUND",
  TEMPLATE_DEFAULT_PATIENT_LIMIT_REACHED:
    "TEMPLATE_DEFAULT_PATIENT_LIMIT_REACHED",
  TEMPLATE_DEFAULT_CONSULTATION_LIMIT_REACHED:
    "TEMPLATE_DEFAULT_CONSULTATION_LIMIT_REACHED",
  FIELD_NOT_FOUND: "FIELD_NOT_FOUND",
  FIELD_DUPLICATE_KEY: "FIELD_DUPLICATE_KEY",

  // Knowledge base / tokens
  KNOWLEDGE_NOT_FOUND: "KNOWLEDGE_NOT_FOUND",
  INSUFFICIENT_TOKENS: "INSUFFICIENT_TOKENS",
  TOKEN_PACKAGE_NOT_FOUND: "TOKEN_PACKAGE_NOT_FOUND",
  TOKEN_PACKAGE_INACTIVE: "TOKEN_PACKAGE_INACTIVE",

  // Team
  TEAM_MEMBER_NOT_FOUND: "TEAM_MEMBER_NOT_FOUND",
  TEAM_INVITE_CONFLICT: "TEAM_INVITE_CONFLICT",
  TEAM_CANNOT_REMOVE_SELF: "TEAM_CANNOT_REMOVE_SELF",
  TEAM_MAX_USERS_REACHED: "TEAM_MAX_USERS_REACHED",
  TEAM_CANNOT_MODIFY_ADMIN_MODULES: "TEAM_CANNOT_MODIFY_ADMIN_MODULES",
  /** The 2-secretary cap (active + pending non-expired) is full. */
  MEMBERSHIP_CAP_REACHED: "MEMBERSHIP_CAP_REACHED",
  /** Admin membership cannot be removed via the team UI — that flow is
   *  account deletion (Settings → Account → Delete). */
  MEMBERSHIP_CANNOT_REMOVE_ADMIN: "MEMBERSHIP_CANNOT_REMOVE_ADMIN",

  // Account Invite
  ACCOUNT_INVITE_NOT_FOUND: "ACCOUNT_INVITE_NOT_FOUND",
  ACCOUNT_INVITE_EXPIRED: "ACCOUNT_INVITE_EXPIRED",
  ACCOUNT_INVITE_MAX_USES: "ACCOUNT_INVITE_MAX_USES",

  // Module Access
  MODULE_ACCESS_DENIED: "MODULE_ACCESS_DENIED",

  // Onboarding
  ONBOARDING_PENDING: "ONBOARDING_PENDING",
  ONBOARDING_SESSION_NOT_FOUND: "ONBOARDING_SESSION_NOT_FOUND",
  ONBOARDING_ALREADY_COMPLETED: "ONBOARDING_ALREADY_COMPLETED",
  ONBOARDING_NOT_READY: "ONBOARDING_NOT_READY",
  ONBOARDING_MESSAGE_REQUIRED: "ONBOARDING_MESSAGE_REQUIRED",
  ONBOARDING_ABUSE_DETECTED: "ONBOARDING_ABUSE_DETECTED",

  // Workplace
  WORKPLACE_NOT_FOUND: "WORKPLACE_NOT_FOUND",
  WORKPLACE_NOT_MEMBER: "WORKPLACE_NOT_MEMBER",
  WORKPLACE_INSUFFICIENT_ROLE: "WORKPLACE_INSUFFICIENT_ROLE",
  WORKPLACE_CANNOT_REMOVE_LAST_ADMIN: "WORKPLACE_CANNOT_REMOVE_LAST_ADMIN",
  WORKPLACE_OWNER_ROLE_IMMUTABLE: "WORKPLACE_OWNER_ROLE_IMMUTABLE",
  WORKPLACE_DELETE_FAILED: "WORKPLACE_DELETE_FAILED",

  // Workplace Schedule
  SCHEDULE_NOT_FOUND: "SCHEDULE_NOT_FOUND",
  SCHEDULE_ALREADY_PUBLISHED: "SCHEDULE_ALREADY_PUBLISHED",
  SCHEDULE_NOT_PUBLISHED: "SCHEDULE_NOT_PUBLISHED",
  SCHEDULE_SHARE_NOT_FOUND: "SCHEDULE_SHARE_NOT_FOUND",
  SCHEDULE_SHARE_EXPIRED: "SCHEDULE_SHARE_EXPIRED",
  SCHEDULE_SHARE_REVOKED: "SCHEDULE_SHARE_REVOKED",

  // Workplace Invite
  INVITE_NOT_FOUND: "INVITE_NOT_FOUND",
  INVITE_EXPIRED: "INVITE_EXPIRED",
  INVITE_ALREADY_MEMBER: "INVITE_ALREADY_MEMBER",
  INVITE_EMAIL_MISMATCH: "INVITE_EMAIL_MISMATCH",
  INVITE_MAX_USES_REACHED: "INVITE_MAX_USES_REACHED",
  INVITE_NOT_PENDING: "INVITE_NOT_PENDING",
  INVITE_NO_EMAIL: "INVITE_NO_EMAIL",

  // Sector
  SECTOR_NOT_FOUND: "SECTOR_NOT_FOUND",
  SECTOR_NAME_TAKEN: "SECTOR_NAME_TAKEN",

  // WorkplaceShift
  SHIFT_NOT_FOUND: "SHIFT_NOT_FOUND",

  // Calendar Event
  CALENDAR_EVENT_NOT_FOUND: "CALENDAR_EVENT_NOT_FOUND",
  CALENDAR_EVENT_INVALID_PATIENT_LINK: "CALENDAR_EVENT_INVALID_PATIENT_LINK",

  // Professional
  PROFESSIONAL_NOT_FOUND: "PROFESSIONAL_NOT_FOUND",
  PROFESSIONAL_ALREADY_LINKED: "PROFESSIONAL_ALREADY_LINKED",
  PROFESSIONAL_CANNOT_EDIT_LINKED: "PROFESSIONAL_CANNOT_EDIT_LINKED",

  // Workplace Member
  MEMBER_NOT_FOUND: "MEMBER_NOT_FOUND",
  MEMBER_SOLE_ADMIN: "MEMBER_SOLE_ADMIN",

  // File
  FILE_REQUIRED: "FILE_REQUIRED",
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
  FILE_INVALID_TYPE: "FILE_INVALID_TYPE",
  FILE_UPLOAD_FAILED: "FILE_UPLOAD_FAILED",
  FILE_DOWNLOAD_FAILED: "FILE_DOWNLOAD_FAILED",

  // Feedback Report
  FEEDBACK_REPORT_NOT_FOUND: "FEEDBACK_REPORT_NOT_FOUND",
  FEEDBACK_REPORT_IMAGE_NOT_FOUND: "FEEDBACK_REPORT_IMAGE_NOT_FOUND",
  FEEDBACK_REPORT_IMAGE_LIMIT_EXCEEDED: "FEEDBACK_REPORT_IMAGE_LIMIT_EXCEEDED",

  // Knowledge Base
  KNOWLEDGE_BASE_LIMIT_REACHED: "KNOWLEDGE_BASE_LIMIT_REACHED",
  KNOWLEDGE_BASE_PARSE_FAILED: "KNOWLEDGE_BASE_PARSE_FAILED",

  // Patient Document
  PATIENT_DOCUMENT_NOT_FOUND: "PATIENT_DOCUMENT_NOT_FOUND",
  /** Lookup failed for a `document_template` — either missing, soft-deleted,
   *  or owned by a different account. Surfaced as a dismissible toast on
   *  the FE so the user falls back to a blank form. */
  DOCUMENT_TEMPLATE_NOT_FOUND: "DOCUMENT_TEMPLATE_NOT_FOUND",
  /** Public document-share hash unknown / never existed. Used by both the
   *  meta and verify endpoints so the response shape doesn't leak presence. */
  DOCUMENT_SHARE_NOT_FOUND: "DOCUMENT_SHARE_NOT_FOUND",
  /** Share was explicitly revoked by the professional (or auto-revoked by
   *  re-issuing a new share for the same document). */
  DOCUMENT_SHARE_REVOKED: "DOCUMENT_SHARE_REVOKED",
  /** Share's `expires_at` has passed. */
  DOCUMENT_SHARE_EXPIRED: "DOCUMENT_SHARE_EXPIRED",
  /** Wrong PIN. Intentionally vague to avoid existence-disclosure attacks. */
  DOCUMENT_SHARE_INVALID_PIN: "DOCUMENT_SHARE_INVALID_PIN",
  /** Too many failed PIN attempts in the rolling window. */
  DOCUMENT_SHARE_RATE_LIMITED: "DOCUMENT_SHARE_RATE_LIMITED",
  /** Document creation blocked because the professional profile is missing the
   *  council number (CRM / CRO / CRP…). Surfaced as a CTA on the frontend. */
  PATIENT_DOCUMENT_PROFESSIONAL_PROFILE_INCOMPLETE:
    "PATIENT_DOCUMENT_PROFESSIONAL_PROFILE_INCOMPLETE",

  // Digital Signature (ICP-Brasil providers — BirdID Fase 1)
  /** Upstream signature provider is unreachable or returned a 5xx. */
  SIGNATURE_PROVIDER_UNAVAILABLE: "SIGNATURE_PROVIDER_UNAVAILABLE",
  /** Caller asked for a provider not yet implemented by the factory. */
  SIGNATURE_PROVIDER_UNSUPPORTED: "SIGNATURE_PROVIDER_UNSUPPORTED",
  /** CPF + OTP combination rejected by the provider. */
  SIGNATURE_INVALID_CREDENTIALS: "SIGNATURE_INVALID_CREDENTIALS",
  /** Too many failed signature auth attempts in the rolling window. */
  SIGNATURE_AUTH_RATE_LIMITED: "SIGNATURE_AUTH_RATE_LIMITED",
  /** Session lookup failed (id unknown, scoped to another user, expired or
   *  revoked). Intentionally collapsed into one code to avoid leaking
   *  existence vs expiration. */
  SIGNATURE_SESSION_NOT_FOUND_OR_EXPIRED:
    "SIGNATURE_SESSION_NOT_FOUND_OR_EXPIRED",
  /** Active session token rejected mid-sign (the upstream invalidated it).
   *  The use case revokes the local row and the FE must re-authenticate. */
  SIGNATURE_SESSION_INVALID: "SIGNATURE_SESSION_INVALID",
  /** CPF supplied to the auth endpoint does not match `user.document` (or
   *  the certificate subject) — defense-in-depth against a swapped identity. */
  SIGNATURE_CPF_MISMATCH: "SIGNATURE_CPF_MISMATCH",
  /** The user has no `document` (CPF) on file — gate before opening the
   *  BirdID modal on the FE. */
  USER_DOCUMENT_REQUIRED_FOR_SIGNATURE: "USER_DOCUMENT_REQUIRED_FOR_SIGNATURE",
  /** Invalid CPF (failed check-digit validation when saving Settings). */
  USER_DOCUMENT_INVALID: "USER_DOCUMENT_INVALID",
  /** A previous signature already exists for the document — re-signing is
   *  not allowed in Fase 1 (duplicate the document if a fresh signature is
   *  required). */
  PATIENT_DOCUMENT_ALREADY_SIGNED: "PATIENT_DOCUMENT_ALREADY_SIGNED",
  /** Decoded `pdfBase64` is empty or lacks the `%PDF-` magic number. */
  PATIENT_DOCUMENT_INVALID_PDF: "PATIENT_DOCUMENT_INVALID_PDF",
  /** Caller asked for the signed PDF of a document that wasn't signed yet. */
  PATIENT_DOCUMENT_NOT_SIGNED: "PATIENT_DOCUMENT_NOT_SIGNED",
  /** Live signing gate — account is not in `SIGNATURE_LIVE_ALLOWLIST`. */
  SIGNATURE_ACCOUNT_NOT_ALLOWED: "SIGNATURE_ACCOUNT_NOT_ALLOWED",
  /** Recomputed SHA-256 of the stored signed PDF does not match the audit
   *  row. Indicates tampering or storage corruption — surfaced as 500. */
  PATIENT_DOCUMENT_SIGNATURE_INTEGRITY_FAILED:
    "PATIENT_DOCUMENT_SIGNATURE_INTEGRITY_FAILED",

  // AI
  AI_TRANSCRIPTION_FAILED: "AI_TRANSCRIPTION_FAILED",
  AI_AUDIO_OPTIMIZATION_FAILED: "AI_AUDIO_OPTIMIZATION_FAILED",
  AI_PROVIDER_UNAVAILABLE: "AI_PROVIDER_UNAVAILABLE",
  AI_TOOL_NOT_FOUND: "AI_TOOL_NOT_FOUND",
  /** FORBIDDEN-family: the tool exists but the current copilot module lacks
   *  the capability it requires (webSearch/writes). Distinct from NOT_FOUND
   *  so a capability misconfiguration doesn't masquerade as a missing tool. */
  AI_TOOL_NOT_ALLOWED: "AI_TOOL_NOT_ALLOWED",
  AI_SKILL_NOT_FOUND: "AI_SKILL_NOT_FOUND",
  AI_SKILL_DUPLICATE: "AI_SKILL_DUPLICATE",

  // Transcription
  TRANSCRIPTION_SESSION_NOT_FOUND: "TRANSCRIPTION_SESSION_NOT_FOUND",
  TRANSCRIPTION_SESSION_ACTIVE: "TRANSCRIPTION_SESSION_ACTIVE",
  TRANSCRIPTION_SESSION_NOT_RECORDING: "TRANSCRIPTION_SESSION_NOT_RECORDING",

  // Copilot
  COPILOT_NO_TRANSCRIPTION: "COPILOT_NO_TRANSCRIPTION",
  COPILOT_NO_TEMPLATE_FIELDS: "COPILOT_NO_TEMPLATE_FIELDS",
  COPILOT_CONTEXT_ASSEMBLY_FAILED: "COPILOT_CONTEXT_ASSEMBLY_FAILED",
  COPILOT_TOOL_EXECUTION_FAILED: "COPILOT_TOOL_EXECUTION_FAILED",
  COPILOT_RATE_LIMITED: "COPILOT_RATE_LIMITED",
  COPILOT_TIMEOUT: "COPILOT_TIMEOUT",
  COPILOT_INTERNAL_ERROR: "COPILOT_INTERNAL_ERROR",

  // Rate Limiting
  AI_RATE_LIMIT: "AI_RATE_LIMIT",
  AUTH_RATE_LIMIT: "AUTH_RATE_LIMIT",
  /** Anonymous /api/public/* surface — coarse IP-keyed HTTP shield. The
   *  use-case layer still owns the per-resource brute-force guard. */
  PUBLIC_RATE_LIMIT: "PUBLIC_RATE_LIMIT",

  // Infrastructure
  QUEUE_NOT_FOUND: "QUEUE_NOT_FOUND",
  WEB_SEARCH_FAILED: "WEB_SEARCH_FAILED",

  // Import
  IMPORT_ALREADY_RUNNING: "IMPORT_ALREADY_RUNNING",
  IMPORT_NOT_FOUND: "IMPORT_NOT_FOUND",
  IMPORT_ENTITY_TYPE_NOT_REGISTERED: "IMPORT_ENTITY_TYPE_NOT_REGISTERED",
  IMPORT_ROW_LIMIT_EXCEEDED: "IMPORT_ROW_LIMIT_EXCEEDED",

  // Schedule import (AI)
  SCHEDULE_IMPORT_NOT_FOUND: "SCHEDULE_IMPORT_NOT_FOUND",
  SCHEDULE_IMPORT_ALREADY_RUNNING: "SCHEDULE_IMPORT_ALREADY_RUNNING",
  SCHEDULE_IMPORT_INVALID_STATUS: "SCHEDULE_IMPORT_INVALID_STATUS",
  SCHEDULE_IMPORT_FILE_TOO_COMPLEX: "SCHEDULE_IMPORT_FILE_TOO_COMPLEX",
  SCHEDULE_IMPORT_NO_EVENTS_FOUND: "SCHEDULE_IMPORT_NO_EVENTS_FOUND",

  // Billing
  BILLING_PROVIDER_NOT_CONFIGURED: "BILLING_PROVIDER_NOT_CONFIGURED",
  BILLING_CHECKOUT_FAILED: "BILLING_CHECKOUT_FAILED",
  BILLING_WEBHOOK_INVALID_SIGNATURE: "BILLING_WEBHOOK_INVALID_SIGNATURE",
  BILLING_WEBHOOK_PAYLOAD_INVALID: "BILLING_WEBHOOK_PAYLOAD_INVALID",
  PAYMENT_INTENT_NOT_FOUND: "PAYMENT_INTENT_NOT_FOUND",

  // Subscriptions
  SUBSCRIPTION_PLAN_NOT_FOUND: "SUBSCRIPTION_PLAN_NOT_FOUND",
  SUBSCRIPTION_NOT_FOUND: "SUBSCRIPTION_NOT_FOUND",
  SUBSCRIPTION_ALREADY_ACTIVE: "SUBSCRIPTION_ALREADY_ACTIVE",
  SUBSCRIPTION_NOT_REFUNDABLE: "SUBSCRIPTION_NOT_REFUNDABLE",
  SUBSCRIPTION_NOT_REACTIVATABLE: "SUBSCRIPTION_NOT_REACTIVATABLE",
  ACCOUNT_BLOCKED: "ACCOUNT_BLOCKED",

  // WhatsApp Gateway (pombo) — devices
  DEVICE_NOT_FOUND: "DEVICE_NOT_FOUND",
  /** Registration with a name another device already owns. The DB `@unique`
   *  on `device.name` is the real guard; this is how it surfaces. */
  DEVICE_NAME_TAKEN: "DEVICE_NAME_TAKEN",
  /** `POST /devices/:id/connect` on a device whose socket is already live. */
  DEVICE_ALREADY_CONNECTED: "DEVICE_ALREADY_CONNECTED",
  /** Sending to a device whose socket is not live → no queue (ADR-005). */
  DEVICE_OFFLINE: "DEVICE_OFFLINE",

  // WhatsApp Gateway (pombo) — messaging
  MESSAGE_NOT_FOUND: "MESSAGE_NOT_FOUND",
  /** Same `Idempotency-Key` + a DIFFERENT payload. (Same key + same payload
   *  replays the original 202 and is NOT an error.) */
  IDEMPOTENCY_KEY_CONFLICT: "IDEMPOTENCY_KEY_CONFLICT",
  /** The target number is not a WhatsApp account (resolveJid → null). */
  NUMBER_NOT_ON_WHATSAPP: "NUMBER_NOT_ON_WHATSAPP",
  /** `connect` requested while `WHATSAPP_ENABLED=false` — the gateway is
   *  disabled at boot, so there is no socket to open. */
  WA_GATEWAY_DISABLED: "WA_GATEWAY_DISABLED",

  // Mail
  MAIL_SEND_FAILED: "MAIL_SEND_FAILED",

  // Transport-level (HTTP status defaults). Used by AppError subclasses and by
  // middleware that responds outside of a thrown AppError (rate-limit, 404
  // fallback). Keep in sync with i18n/locales/*/errors.json.
  BAD_REQUEST: "BAD_REQUEST",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  TOO_MANY_REQUESTS: "TOO_MANY_REQUESTS",
  RATE_LIMIT: "RATE_LIMIT",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
