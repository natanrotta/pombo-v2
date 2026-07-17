import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "./async-handler.middleware";

function mockReqResNext() {
  const req = {} as Request;
  const res = {} as Response;
  const next = vi.fn() as unknown as NextFunction;
  return { req, res, next };
}

describe("asyncHandler", () => {
  it("should call the handler and not call next on success", async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    const { req, res, next } = mockReqResNext();

    await asyncHandler(handler)(req, res, next);

    expect(handler).toHaveBeenCalledWith(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });

  it("should call next with error when handler rejects", async () => {
    const error = new Error("boom");
    const handler = vi.fn().mockRejectedValue(error);
    const { req, res, next } = mockReqResNext();

    await asyncHandler(handler)(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("should call next with error when async handler throws before awaiting", async () => {
    const error = new Error("async boom");
    const handler = vi.fn().mockImplementation(async () => {
      throw error;
    });
    const { req, res, next } = mockReqResNext();

    await asyncHandler(handler)(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
