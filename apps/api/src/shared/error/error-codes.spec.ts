import { ErrorCodes } from "./error-codes";

describe("ErrorCodes", () => {
  it("should have all values as strings", () => {
    for (const [key, value] of Object.entries(ErrorCodes)) {
      expect(typeof value).toBe("string");
      expect(value).toBe(key);
    }
  });

  it("should contain the generic fallback code", () => {
    expect(ErrorCodes.GENERIC_ERROR).toBe("GENERIC_ERROR");
  });

  it("should contain user error codes", () => {
    expect(ErrorCodes.USER_NOT_FOUND).toBe("USER_NOT_FOUND");
  });

  it("should contain auth error codes", () => {
    expect(ErrorCodes.AUTH_INVALID_CREDENTIALS).toBe(
      "AUTH_INVALID_CREDENTIALS",
    );
    expect(ErrorCodes.AUTH_TOKEN_EXPIRED).toBe("AUTH_TOKEN_EXPIRED");
    expect(ErrorCodes.AUTH_TOKEN_INVALID).toBe("AUTH_TOKEN_INVALID");
    expect(ErrorCodes.AUTH_TOKEN_REVOKED).toBe("AUTH_TOKEN_REVOKED");
    expect(ErrorCodes.AUTH_NO_TOKEN).toBe("AUTH_NO_TOKEN");
    expect(ErrorCodes.AUTH_INSUFFICIENT_ROLE).toBe("AUTH_INSUFFICIENT_ROLE");
    expect(ErrorCodes.AUTH_EMAIL_ALREADY_EXISTS).toBe(
      "AUTH_EMAIL_ALREADY_EXISTS",
    );
    expect(ErrorCodes.AUTH_GOOGLE_ONLY).toBe("AUTH_GOOGLE_ONLY");
    expect(ErrorCodes.AUTH_GOOGLE_TOKEN_INVALID).toBe(
      "AUTH_GOOGLE_TOKEN_INVALID",
    );
    expect(ErrorCodes.AUTH_NO_ACTIVE_MEMBERSHIP).toBe(
      "AUTH_NO_ACTIVE_MEMBERSHIP",
    );
    expect(ErrorCodes.AUTH_MEMBERSHIP_NOT_FOUND).toBe(
      "AUTH_MEMBERSHIP_NOT_FOUND",
    );
  });

  it("should contain patient error codes", () => {
    expect(ErrorCodes.PATIENT_NOT_FOUND).toBe("PATIENT_NOT_FOUND");
    expect(ErrorCodes.PATIENT_TEMPLATE_NOT_FOUND).toBe(
      "PATIENT_TEMPLATE_NOT_FOUND",
    );
    expect(ErrorCodes.PATIENT_TEMPLATE_LIMIT_REACHED).toBe(
      "PATIENT_TEMPLATE_LIMIT_REACHED",
    );
    expect(ErrorCodes.PATIENT_TEMPLATE_ALREADY_LINKED).toBe(
      "PATIENT_TEMPLATE_ALREADY_LINKED",
    );
  });

  it("should contain contact error codes", () => {
    expect(ErrorCodes.CONTACT_NOT_FOUND).toBe("CONTACT_NOT_FOUND");
    expect(ErrorCodes.CONTACT_RELATION_EXISTS).toBe("CONTACT_RELATION_EXISTS");
    expect(ErrorCodes.CONTACT_RELATION_NOT_FOUND).toBe(
      "CONTACT_RELATION_NOT_FOUND",
    );
  });

  it("should contain consultation error codes", () => {
    expect(ErrorCodes.CONSULTATION_NOT_FOUND).toBe("CONSULTATION_NOT_FOUND");
    expect(ErrorCodes.ATTACHMENT_NOT_FOUND).toBe("ATTACHMENT_NOT_FOUND");
  });

  it("should contain tag error codes", () => {
    expect(ErrorCodes.TAG_NOT_FOUND).toBe("TAG_NOT_FOUND");
    expect(ErrorCodes.TAG_DUPLICATE_NAME).toBe("TAG_DUPLICATE_NAME");
  });

  it("should contain template error codes", () => {
    expect(ErrorCodes.TEMPLATE_NOT_FOUND).toBe("TEMPLATE_NOT_FOUND");
    expect(ErrorCodes.FIELD_NOT_FOUND).toBe("FIELD_NOT_FOUND");
    expect(ErrorCodes.FIELD_DUPLICATE_KEY).toBe("FIELD_DUPLICATE_KEY");
  });

  it("should contain knowledge/token error codes", () => {
    expect(ErrorCodes.KNOWLEDGE_NOT_FOUND).toBe("KNOWLEDGE_NOT_FOUND");
    expect(ErrorCodes.INSUFFICIENT_TOKENS).toBe("INSUFFICIENT_TOKENS");
  });

  it("should contain workplace error codes", () => {
    expect(ErrorCodes.WORKPLACE_NOT_FOUND).toBe("WORKPLACE_NOT_FOUND");
    expect(ErrorCodes.WORKPLACE_NOT_MEMBER).toBe("WORKPLACE_NOT_MEMBER");
    expect(ErrorCodes.WORKPLACE_INSUFFICIENT_ROLE).toBe(
      "WORKPLACE_INSUFFICIENT_ROLE",
    );
    expect(ErrorCodes.WORKPLACE_CANNOT_REMOVE_LAST_ADMIN).toBe(
      "WORKPLACE_CANNOT_REMOVE_LAST_ADMIN",
    );
    expect(ErrorCodes.WORKPLACE_DELETE_FAILED).toBe("WORKPLACE_DELETE_FAILED");
  });

  it("should contain workplace schedule + share error codes", () => {
    expect(ErrorCodes.SCHEDULE_NOT_FOUND).toBe("SCHEDULE_NOT_FOUND");
    expect(ErrorCodes.SCHEDULE_ALREADY_PUBLISHED).toBe(
      "SCHEDULE_ALREADY_PUBLISHED",
    );
    expect(ErrorCodes.SCHEDULE_NOT_PUBLISHED).toBe("SCHEDULE_NOT_PUBLISHED");
    expect(ErrorCodes.SCHEDULE_SHARE_NOT_FOUND).toBe(
      "SCHEDULE_SHARE_NOT_FOUND",
    );
    expect(ErrorCodes.SCHEDULE_SHARE_EXPIRED).toBe("SCHEDULE_SHARE_EXPIRED");
    expect(ErrorCodes.SCHEDULE_SHARE_REVOKED).toBe("SCHEDULE_SHARE_REVOKED");
  });

  it("should contain invite error codes", () => {
    expect(ErrorCodes.INVITE_NOT_FOUND).toBe("INVITE_NOT_FOUND");
    expect(ErrorCodes.INVITE_EXPIRED).toBe("INVITE_EXPIRED");
    expect(ErrorCodes.INVITE_ALREADY_MEMBER).toBe("INVITE_ALREADY_MEMBER");
    expect(ErrorCodes.INVITE_EMAIL_MISMATCH).toBe("INVITE_EMAIL_MISMATCH");
    expect(ErrorCodes.INVITE_MAX_USES_REACHED).toBe("INVITE_MAX_USES_REACHED");
  });

  it("should contain professional/member error codes", () => {
    expect(ErrorCodes.PROFESSIONAL_NOT_FOUND).toBe("PROFESSIONAL_NOT_FOUND");
    expect(ErrorCodes.PROFESSIONAL_ALREADY_LINKED).toBe(
      "PROFESSIONAL_ALREADY_LINKED",
    );
    expect(ErrorCodes.PROFESSIONAL_CANNOT_EDIT_LINKED).toBe(
      "PROFESSIONAL_CANNOT_EDIT_LINKED",
    );
    expect(ErrorCodes.MEMBER_NOT_FOUND).toBe("MEMBER_NOT_FOUND");
    expect(ErrorCodes.MEMBER_SOLE_ADMIN).toBe("MEMBER_SOLE_ADMIN");
  });

  it("should contain file error codes", () => {
    expect(ErrorCodes.FILE_REQUIRED).toBe("FILE_REQUIRED");
    expect(ErrorCodes.FILE_TOO_LARGE).toBe("FILE_TOO_LARGE");
    expect(ErrorCodes.FILE_INVALID_TYPE).toBe("FILE_INVALID_TYPE");
    expect(ErrorCodes.FILE_UPLOAD_FAILED).toBe("FILE_UPLOAD_FAILED");
  });

  it("should contain AI error codes", () => {
    expect(ErrorCodes.AI_TRANSCRIPTION_FAILED).toBe("AI_TRANSCRIPTION_FAILED");
    expect(ErrorCodes.AI_AUDIO_OPTIMIZATION_FAILED).toBe(
      "AI_AUDIO_OPTIMIZATION_FAILED",
    );
    expect(ErrorCodes.AI_PROVIDER_UNAVAILABLE).toBe("AI_PROVIDER_UNAVAILABLE");
    expect(ErrorCodes.AI_TOOL_NOT_FOUND).toBe("AI_TOOL_NOT_FOUND");
    expect(ErrorCodes.AI_TOOL_NOT_ALLOWED).toBe("AI_TOOL_NOT_ALLOWED");
    expect(ErrorCodes.AI_SKILL_NOT_FOUND).toBe("AI_SKILL_NOT_FOUND");
    expect(ErrorCodes.AI_SKILL_DUPLICATE).toBe("AI_SKILL_DUPLICATE");
  });

  it("should contain team error codes", () => {
    expect(ErrorCodes.TEAM_MEMBER_NOT_FOUND).toBe("TEAM_MEMBER_NOT_FOUND");
    expect(ErrorCodes.TEAM_INVITE_CONFLICT).toBe("TEAM_INVITE_CONFLICT");
    expect(ErrorCodes.TEAM_CANNOT_REMOVE_SELF).toBe("TEAM_CANNOT_REMOVE_SELF");
    expect(ErrorCodes.TEAM_MAX_USERS_REACHED).toBe("TEAM_MAX_USERS_REACHED");
    expect(ErrorCodes.TEAM_CANNOT_MODIFY_ADMIN_MODULES).toBe(
      "TEAM_CANNOT_MODIFY_ADMIN_MODULES",
    );
    expect(ErrorCodes.MEMBERSHIP_CAP_REACHED).toBe("MEMBERSHIP_CAP_REACHED");
    expect(ErrorCodes.MEMBERSHIP_CANNOT_REMOVE_ADMIN).toBe(
      "MEMBERSHIP_CANNOT_REMOVE_ADMIN",
    );
  });

  it("should contain account invite error codes", () => {
    expect(ErrorCodes.ACCOUNT_INVITE_NOT_FOUND).toBe(
      "ACCOUNT_INVITE_NOT_FOUND",
    );
    expect(ErrorCodes.ACCOUNT_INVITE_EXPIRED).toBe("ACCOUNT_INVITE_EXPIRED");
    expect(ErrorCodes.ACCOUNT_INVITE_MAX_USES).toBe("ACCOUNT_INVITE_MAX_USES");
  });

  it("should contain module access error codes", () => {
    expect(ErrorCodes.MODULE_ACCESS_DENIED).toBe("MODULE_ACCESS_DENIED");
  });

  it("should contain calendar event error codes", () => {
    expect(ErrorCodes.CALENDAR_EVENT_NOT_FOUND).toBe(
      "CALENDAR_EVENT_NOT_FOUND",
    );
  });

  it("should contain sector and shift error codes", () => {
    expect(ErrorCodes.SECTOR_NOT_FOUND).toBe("SECTOR_NOT_FOUND");
    expect(ErrorCodes.SECTOR_NAME_TAKEN).toBe("SECTOR_NAME_TAKEN");
    expect(ErrorCodes.SHIFT_NOT_FOUND).toBe("SHIFT_NOT_FOUND");
  });

  it("should contain transcription error codes", () => {
    expect(ErrorCodes.TRANSCRIPTION_SESSION_NOT_FOUND).toBe(
      "TRANSCRIPTION_SESSION_NOT_FOUND",
    );
    expect(ErrorCodes.TRANSCRIPTION_SESSION_ACTIVE).toBe(
      "TRANSCRIPTION_SESSION_ACTIVE",
    );
    expect(ErrorCodes.TRANSCRIPTION_SESSION_NOT_RECORDING).toBe(
      "TRANSCRIPTION_SESSION_NOT_RECORDING",
    );
  });

  it("should contain copilot error codes", () => {
    expect(ErrorCodes.COPILOT_NO_TRANSCRIPTION).toBe(
      "COPILOT_NO_TRANSCRIPTION",
    );
    expect(ErrorCodes.COPILOT_NO_TEMPLATE_FIELDS).toBe(
      "COPILOT_NO_TEMPLATE_FIELDS",
    );
    expect(ErrorCodes.COPILOT_CONTEXT_ASSEMBLY_FAILED).toBe(
      "COPILOT_CONTEXT_ASSEMBLY_FAILED",
    );
    expect(ErrorCodes.COPILOT_TOOL_EXECUTION_FAILED).toBe(
      "COPILOT_TOOL_EXECUTION_FAILED",
    );
    expect(ErrorCodes.COPILOT_RATE_LIMITED).toBe("COPILOT_RATE_LIMITED");
    expect(ErrorCodes.COPILOT_TIMEOUT).toBe("COPILOT_TIMEOUT");
    expect(ErrorCodes.COPILOT_INTERNAL_ERROR).toBe("COPILOT_INTERNAL_ERROR");
  });

  it("should contain infrastructure error codes", () => {
    expect(ErrorCodes.QUEUE_NOT_FOUND).toBe("QUEUE_NOT_FOUND");
    expect(ErrorCodes.WEB_SEARCH_FAILED).toBe("WEB_SEARCH_FAILED");
  });

  it("should contain import error codes", () => {
    expect(ErrorCodes.IMPORT_ALREADY_RUNNING).toBe("IMPORT_ALREADY_RUNNING");
    expect(ErrorCodes.IMPORT_NOT_FOUND).toBe("IMPORT_NOT_FOUND");
    expect(ErrorCodes.IMPORT_ENTITY_TYPE_NOT_REGISTERED).toBe(
      "IMPORT_ENTITY_TYPE_NOT_REGISTERED",
    );
    expect(ErrorCodes.IMPORT_ROW_LIMIT_EXCEEDED).toBe(
      "IMPORT_ROW_LIMIT_EXCEEDED",
    );
  });

  it("should contain rate-limit error codes by name", () => {
    expect(ErrorCodes.AI_RATE_LIMIT).toBe("AI_RATE_LIMIT");
    expect(ErrorCodes.AUTH_RATE_LIMIT).toBe("AUTH_RATE_LIMIT");
    expect(ErrorCodes.PUBLIC_RATE_LIMIT).toBe("PUBLIC_RATE_LIMIT");
  });

  it("should contain transport-level error codes", () => {
    expect(ErrorCodes.BAD_REQUEST).toBe("BAD_REQUEST");
    expect(ErrorCodes.UNAUTHORIZED).toBe("UNAUTHORIZED");
    expect(ErrorCodes.FORBIDDEN).toBe("FORBIDDEN");
    expect(ErrorCodes.NOT_FOUND).toBe("NOT_FOUND");
    expect(ErrorCodes.CONFLICT).toBe("CONFLICT");
    expect(ErrorCodes.VALIDATION_ERROR).toBe("VALIDATION_ERROR");
    expect(ErrorCodes.TOO_MANY_REQUESTS).toBe("TOO_MANY_REQUESTS");
    expect(ErrorCodes.RATE_LIMIT).toBe("RATE_LIMIT");
    expect(ErrorCodes.INTERNAL_ERROR).toBe("INTERNAL_ERROR");
    expect(ErrorCodes.SERVICE_UNAVAILABLE).toBe("SERVICE_UNAVAILABLE");
  });

  it("should contain feedback report error codes", () => {
    expect(ErrorCodes.FEEDBACK_REPORT_NOT_FOUND).toBe(
      "FEEDBACK_REPORT_NOT_FOUND",
    );
    expect(ErrorCodes.FEEDBACK_REPORT_IMAGE_NOT_FOUND).toBe(
      "FEEDBACK_REPORT_IMAGE_NOT_FOUND",
    );
    expect(ErrorCodes.FEEDBACK_REPORT_IMAGE_LIMIT_EXCEEDED).toBe(
      "FEEDBACK_REPORT_IMAGE_LIMIT_EXCEEDED",
    );
  });

  it("should contain schedule import error codes", () => {
    expect(ErrorCodes.SCHEDULE_IMPORT_NOT_FOUND).toBe(
      "SCHEDULE_IMPORT_NOT_FOUND",
    );
    expect(ErrorCodes.SCHEDULE_IMPORT_ALREADY_RUNNING).toBe(
      "SCHEDULE_IMPORT_ALREADY_RUNNING",
    );
    expect(ErrorCodes.SCHEDULE_IMPORT_INVALID_STATUS).toBe(
      "SCHEDULE_IMPORT_INVALID_STATUS",
    );
    expect(ErrorCodes.SCHEDULE_IMPORT_FILE_TOO_COMPLEX).toBe(
      "SCHEDULE_IMPORT_FILE_TOO_COMPLEX",
    );
    expect(ErrorCodes.SCHEDULE_IMPORT_NO_EVENTS_FOUND).toBe(
      "SCHEDULE_IMPORT_NO_EVENTS_FOUND",
    );
  });

  it("should have exactly 175 error codes", () => {
    expect(Object.keys(ErrorCodes)).toHaveLength(175);
  });
});
