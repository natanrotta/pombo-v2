import { Prisma } from "@generated/prisma/client";
import {
  AppError,
  ConflictError,
  NotFoundError,
  InternalError,
} from "@shared/error";

export function mapPrismaError(error: unknown): AppError {
  // Pass-through for domain / application errors. Repos commonly wrap
  // their work in a single `try / catch (e) { throw mapPrismaError(e); }`,
  // which means anything thrown from inside a transactional helper
  // (e.g. `PhoneReplacementService` throwing `ValidationError`) used to
  // get re-wrapped as `InternalError("Unknown database error")` and
  // surface to the FE as a generic 500. Honouring AppError subclasses
  // here keeps the original code / status / message intact.
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        return new ConflictError("Unique constraint violation", {
          fields: error.meta?.["target"],
        });
      case "P2025":
        return new NotFoundError("Record not found");
      case "P2003":
        return new ConflictError("Foreign key constraint violation");
      case "P2014":
        return new ConflictError("Relation violation");
      default:
        return new InternalError("Database error", { code: error.code });
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return new InternalError("Database validation error");
  }

  return new InternalError("Unknown database error");
}
