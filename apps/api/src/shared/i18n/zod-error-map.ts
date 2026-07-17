import { ZodIssueCode, ZodErrorMap } from "zod";
import { i18n } from "./index";

export function createZodErrorMap(locale: string): ZodErrorMap {
  return (issue, ctx) => {
    const t = (key: string, options?: Record<string, unknown>) =>
      i18n.t(`validation:${key}`, { lng: locale, ...options });

    switch (issue.code) {
      case ZodIssueCode.invalid_type:
        if (issue.received === "undefined" || issue.received === "null") {
          return { message: t("required") };
        }
        return {
          message: t("invalidType", {
            expected: issue.expected,
            received: issue.received,
          }),
        };

      case ZodIssueCode.too_small:
        if (issue.type === "string") {
          if (issue.minimum === 1) {
            return { message: t("required") };
          }
          return {
            message: t("string.tooSmall", { minimum: issue.minimum }),
          };
        }
        if (issue.type === "number") {
          return {
            message: t("number.tooSmall", { minimum: issue.minimum }),
          };
        }
        if (issue.type === "array") {
          return {
            message: t("array.tooSmall", { minimum: issue.minimum }),
          };
        }
        break;

      case ZodIssueCode.too_big:
        if (issue.type === "string") {
          return {
            message: t("string.tooBig", { maximum: issue.maximum }),
          };
        }
        if (issue.type === "number") {
          return {
            message: t("number.tooBig", { maximum: issue.maximum }),
          };
        }
        break;

      case ZodIssueCode.invalid_string:
        if (issue.validation === "email") {
          return { message: t("string.email") };
        }
        if (issue.validation === "uuid") {
          return { message: t("string.uuid") };
        }
        if (issue.validation === "url") {
          return { message: t("string.url") };
        }
        return { message: t("string.invalid") };

      case ZodIssueCode.invalid_enum_value:
        return {
          message: t("invalidEnum", {
            options: issue.options.join(", "),
          }),
        };

      case ZodIssueCode.custom:
        return { message: ctx.defaultError };
    }

    return { message: ctx.defaultError };
  };
}
