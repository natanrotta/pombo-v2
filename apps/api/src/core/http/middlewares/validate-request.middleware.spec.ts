import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { validateRequest } from "./validate-request.middleware";
import { ValidationError } from "@shared/error";

function mockReqResNext(overrides: Partial<Request> = {}) {
  const req = {
    params: {},
    query: {},
    body: {},
    ...overrides,
  } as unknown as Request;
  const res = {} as Response;
  const next = vi.fn() as unknown as NextFunction;
  return { req, res, next };
}

describe("validateRequest", () => {
  it("should call next() when all schemas pass", () => {
    const bodySchema = z.object({ name: z.string() });
    const middleware = validateRequest({ body: bodySchema });
    const { req, res, next } = mockReqResNext({
      body: { name: "John" },
    } as any);

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it("should mutate req.body with parsed values", () => {
    const bodySchema = z.object({ name: z.string().trim() });
    const middleware = validateRequest({ body: bodySchema });
    const { req, res, next } = mockReqResNext({
      body: { name: "  John  " },
    } as any);

    middleware(req, res, next);

    expect(req.body).toEqual({ name: "John" });
    expect(next).toHaveBeenCalledWith();
  });

  it("should call next with ValidationError when body fails", () => {
    const bodySchema = z.object({ name: z.string().min(1) });
    const middleware = validateRequest({ body: bodySchema });
    const { req, res, next } = mockReqResNext({ body: { name: "" } } as any);

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
  });

  it("should call next with ValidationError when params fail", () => {
    const paramsSchema = z.object({ id: z.string().uuid() });
    const middleware = validateRequest({ params: paramsSchema });
    const { req, res, next } = mockReqResNext({
      params: { id: "not-uuid" },
    } as any);

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
  });

  it("should call next with ValidationError when query fails", () => {
    const querySchema = z.object({ page: z.coerce.number().min(1) });
    const middleware = validateRequest({ query: querySchema });
    const { req, res, next } = mockReqResNext({ query: { page: "0" } } as any);

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
  });

  it("should validate all three (params, query, body) together", () => {
    const schemas = {
      params: z.object({ id: z.string().uuid() }),
      query: z.object({ page: z.coerce.number() }),
      body: z.object({ name: z.string() }),
    };
    const uuid = "550e8400-e29b-41d4-a716-446655440000";
    const middleware = validateRequest(schemas);
    const { req, res, next } = mockReqResNext({
      params: { id: uuid },
      query: { page: "1" },
      body: { name: "Test" },
    } as any);

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.params).toEqual({ id: uuid });
    expect((req.query as any).page).toBe(1);
  });

  it("should pass through non-ZodError errors", () => {
    const bodySchema = {
      parse: () => {
        throw new Error("unexpected");
      },
    };
    const middleware = validateRequest({ body: bodySchema as any });
    const { req, res, next } = mockReqResNext();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(next).not.toHaveBeenCalledWith(expect.any(ValidationError));
  });
});
