import {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  InternalError,
  ServiceUnavailableError,
} from "./app-error";
import { ErrorCodes } from "./error-codes";

const subclasses = [
  {
    Class: BadRequestError,
    name: "BadRequestError",
    statusCode: 400,
    defaultCode: "BAD_REQUEST",
    defaultMessage: "Bad request",
    isOperational: true,
  },
  {
    Class: UnauthorizedError,
    name: "UnauthorizedError",
    statusCode: 401,
    defaultCode: "UNAUTHORIZED",
    defaultMessage: "Unauthorized",
    isOperational: true,
  },
  {
    Class: ForbiddenError,
    name: "ForbiddenError",
    statusCode: 403,
    defaultCode: "FORBIDDEN",
    defaultMessage: "Forbidden",
    isOperational: true,
  },
  {
    Class: NotFoundError,
    name: "NotFoundError",
    statusCode: 404,
    defaultCode: "NOT_FOUND",
    defaultMessage: "Resource not found",
    isOperational: true,
  },
  {
    Class: ConflictError,
    name: "ConflictError",
    statusCode: 409,
    defaultCode: "CONFLICT",
    defaultMessage: "Resource already exists",
    isOperational: true,
  },
  {
    Class: ValidationError,
    name: "ValidationError",
    statusCode: 422,
    defaultCode: "VALIDATION_ERROR",
    defaultMessage: "Validation failed",
    isOperational: true,
  },
  {
    Class: InternalError,
    name: "InternalError",
    statusCode: 500,
    defaultCode: "INTERNAL_ERROR",
    defaultMessage: "Internal server error",
    isOperational: false,
  },
  {
    Class: ServiceUnavailableError,
    name: "ServiceUnavailableError",
    statusCode: 503,
    defaultCode: "SERVICE_UNAVAILABLE",
    defaultMessage: "Service unavailable",
    isOperational: true,
  },
] as const;

describe.each(subclasses)(
  "$name",
  ({ Class, statusCode, defaultCode, defaultMessage, isOperational }) => {
    it("should have correct defaults", () => {
      const error = new Class();

      expect(error.message).toBe(defaultMessage);
      expect(error.statusCode).toBe(statusCode);
      expect(error.code).toBe(defaultCode);
      expect(error.isOperational).toBe(isOperational);
      expect(error.details).toBeUndefined();
    });

    it("should accept custom message, details, and code", () => {
      const error = new Class(
        "custom msg",
        { field: "name" },
        ErrorCodes.GENERIC_ERROR,
      );

      expect(error.message).toBe("custom msg");
      expect(error.code).toBe(ErrorCodes.GENERIC_ERROR);
      expect(error.details).toEqual({ field: "name" });
    });

    it("should be instanceof AppError and Error", () => {
      const error = new Class();

      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(Error);
    });

    it("should have a stack trace", () => {
      const error = new Class();

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain("app-error.spec");
    });

    it("should return correct toJSON without details", () => {
      const error = new Class();

      expect(error.toJSON()).toEqual({
        message: defaultMessage,
        code: defaultCode,
      });
    });

    it("should return correct toJSON with details", () => {
      const details = { fields: ["email"] };
      const error = new Class("msg", details);

      expect(error.toJSON()).toEqual({
        message: "msg",
        code: defaultCode,
        details,
      });
    });
  },
);
