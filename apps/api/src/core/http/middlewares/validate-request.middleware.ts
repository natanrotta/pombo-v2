import { Request, Response, NextFunction } from "express";
import { ZodError, ZodTypeAny } from "zod";
import { ValidationError } from "@shared/error";
import { createZodErrorMap } from "@shared/i18n/zod-error-map";

interface ValidationSchemas {
  params?: ZodTypeAny;
  query?: ZodTypeAny;
  body?: ZodTypeAny;
}

export function validateRequest(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const errorMap = createZodErrorMap(req.locale || "pt-BR");

      if (schemas.params) {
        req.params = schemas.params.parse(req.params, { errorMap });
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query, { errorMap });
      }
      if (schemas.body) {
        req.body = schemas.body.parse(req.body, { errorMap });
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new ValidationError("Invalid request data", error.flatten()));
        return;
      }
      next(error);
    }
  };
}
