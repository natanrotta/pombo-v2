import { Request, Response, NextFunction } from "express";
import { localeMiddleware } from "./locale.middleware";

function mockReqRes(headers: Record<string, string> = {}) {
  const req = {
    headers,
  } as unknown as Request;
  const res = {} as Response;
  const next = vi.fn() as unknown as NextFunction;
  return { req, res, next };
}

describe("localeMiddleware", () => {
  it("should default to pt-BR when no Accept-Language header", () => {
    const { req, res, next } = mockReqRes();

    localeMiddleware(req, res, next);

    expect(req.locale).toBe("pt-BR");
    expect(next).toHaveBeenCalled();
  });

  it("should parse exact match for supported locale", () => {
    const { req, res, next } = mockReqRes({ "accept-language": "en" });

    localeMiddleware(req, res, next);

    expect(req.locale).toBe("en");
  });

  it("should parse pt-BR locale", () => {
    const { req, res, next } = mockReqRes({ "accept-language": "pt-BR" });

    localeMiddleware(req, res, next);

    expect(req.locale).toBe("pt-BR");
  });

  it("should parse es locale", () => {
    const { req, res, next } = mockReqRes({ "accept-language": "es" });

    localeMiddleware(req, res, next);

    expect(req.locale).toBe("es");
  });

  it("should match by prefix (pt -> pt-BR)", () => {
    const { req, res, next } = mockReqRes({ "accept-language": "pt" });

    localeMiddleware(req, res, next);

    expect(req.locale).toBe("pt-BR");
  });

  it("should match by prefix (en-US -> en)", () => {
    const { req, res, next } = mockReqRes({ "accept-language": "en-US" });

    localeMiddleware(req, res, next);

    expect(req.locale).toBe("en");
  });

  it("should match by prefix (es-AR -> es)", () => {
    const { req, res, next } = mockReqRes({ "accept-language": "es-AR" });

    localeMiddleware(req, res, next);

    expect(req.locale).toBe("es");
  });

  it("should use highest quality language from Accept-Language header", () => {
    const { req, res, next } = mockReqRes({
      "accept-language": "fr;q=0.8, en;q=0.9, pt-BR;q=0.7",
    });

    localeMiddleware(req, res, next);

    expect(req.locale).toBe("en");
  });

  it("should default to pt-BR for unsupported languages", () => {
    const { req, res, next } = mockReqRes({ "accept-language": "ja,zh;q=0.9" });

    localeMiddleware(req, res, next);

    expect(req.locale).toBe("pt-BR");
  });

  it("should handle complex Accept-Language header with quality values", () => {
    const { req, res, next } = mockReqRes({
      "accept-language": "de;q=0.5, es;q=0.8, fr;q=0.3",
    });

    localeMiddleware(req, res, next);

    expect(req.locale).toBe("es");
  });

  it("should default quality to 1 when not specified", () => {
    const { req, res, next } = mockReqRes({
      "accept-language": "es, en;q=0.5",
    });

    localeMiddleware(req, res, next);

    expect(req.locale).toBe("es");
  });

  it("should always call next()", () => {
    const { req, res, next } = mockReqRes({ "accept-language": "en" });

    localeMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
