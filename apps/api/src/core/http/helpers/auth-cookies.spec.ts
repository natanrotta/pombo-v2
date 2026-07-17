import { Response } from "express";

const { envMock } = vi.hoisted(() => ({
  envMock: {
    NODE_ENV: "development" as string,
    REFRESH_TOKEN_EXPIRES_IN: "30d" as string,
    COOKIE_DOMAIN: undefined as string | undefined,
  },
}));

vi.mock("../../config", () => ({
  env: envMock,
}));

vi.mock("@shared/util/parse-expires-in", () => ({
  parseExpiresIn: vi.fn(() => 2_592_000_000), // 30d in ms
}));

import {
  setAuthCookies,
  setAccessTokenCookie,
  clearAuthCookies,
  clearAccessTokenCookie,
  REFRESH_TOKEN_COOKIE,
  CSRF_TOKEN_COOKIE,
  ACCESS_TOKEN_COOKIE,
} from "./auth-cookies";

function mockRes() {
  const cookie = vi.fn();
  const clearCookie = vi.fn();
  return {
    cookie,
    clearCookie,
    res: { cookie, clearCookie } as unknown as Response,
  };
}

describe("auth-cookies helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    envMock.NODE_ENV = "development";
    envMock.COOKIE_DOMAIN = undefined;
  });

  describe("setAuthCookies", () => {
    it("should set both refresh and csrf cookies with lax sameSite in dev", () => {
      const { cookie, res } = mockRes();

      setAuthCookies(res, "rt-token", "csrf-token");

      expect(cookie).toHaveBeenCalledTimes(2);
      expect(cookie).toHaveBeenCalledWith(
        REFRESH_TOKEN_COOKIE,
        "rt-token",
        expect.objectContaining({
          httpOnly: true,
          secure: false,
          sameSite: "lax",
          path: "/api/auth",
          maxAge: 2_592_000_000,
        }),
      );
      expect(cookie).toHaveBeenCalledWith(
        CSRF_TOKEN_COOKIE,
        "csrf-token",
        expect.objectContaining({
          httpOnly: false,
          secure: false,
          sameSite: "lax",
          path: "/",
        }),
      );
    });

    it("should not include domain when COOKIE_DOMAIN is unset", () => {
      const { cookie, res } = mockRes();

      setAuthCookies(res, "rt", "csrf");

      const refreshOpts = cookie.mock.calls[0]![2] as Record<string, unknown>;
      expect(refreshOpts).not.toHaveProperty("domain");
    });

    it("should include domain when COOKIE_DOMAIN is set", () => {
      envMock.COOKIE_DOMAIN = ".example.com";
      const { cookie, res } = mockRes();

      setAuthCookies(res, "rt", "csrf");

      expect(cookie).toHaveBeenCalledWith(
        REFRESH_TOKEN_COOKIE,
        "rt",
        expect.objectContaining({ domain: ".example.com" }),
      );
      expect(cookie).toHaveBeenCalledWith(
        CSRF_TOKEN_COOKIE,
        "csrf",
        expect.objectContaining({ domain: ".example.com" }),
      );
    });
  });

  describe("setAccessTokenCookie", () => {
    it("sets boilerplate_at as an httpOnly, path-/ cookie (JS can't read it)", () => {
      const { cookie, res } = mockRes();

      setAccessTokenCookie(res, "jwt-access");

      expect(cookie).toHaveBeenCalledWith(
        ACCESS_TOKEN_COOKIE,
        "jwt-access",
        expect.objectContaining({
          httpOnly: true,
          secure: false,
          sameSite: "lax",
          path: "/",
          maxAge: 2_592_000_000,
        }),
      );
    });

    it("includes domain when COOKIE_DOMAIN is set", () => {
      envMock.COOKIE_DOMAIN = ".example.com";
      const { cookie, res } = mockRes();

      setAccessTokenCookie(res, "jwt");

      expect(cookie).toHaveBeenCalledWith(
        ACCESS_TOKEN_COOKIE,
        "jwt",
        expect.objectContaining({ domain: ".example.com" }),
      );
    });
  });

  describe("clearAuthCookies", () => {
    it("should clear refresh, csrf AND access cookies with matching paths", () => {
      const { clearCookie, res } = mockRes();

      clearAuthCookies(res);

      expect(clearCookie).toHaveBeenCalledWith(REFRESH_TOKEN_COOKIE, {
        path: "/api/auth",
      });
      expect(clearCookie).toHaveBeenCalledWith(CSRF_TOKEN_COOKIE, {
        path: "/",
      });
      expect(clearCookie).toHaveBeenCalledWith(ACCESS_TOKEN_COOKIE, {
        path: "/",
      });
    });

    it("includes the domain in clearCookie when COOKIE_DOMAIN is set (else the browser keeps the cookie)", () => {
      envMock.COOKIE_DOMAIN = ".example.com";
      const { clearCookie, res } = mockRes();

      clearAuthCookies(res);

      expect(clearCookie).toHaveBeenCalledWith(ACCESS_TOKEN_COOKIE, {
        path: "/",
        domain: ".example.com",
      });
    });
  });

  describe("clearAccessTokenCookie", () => {
    it("clears the access + csrf cookies but NOT the refresh cookie", () => {
      const { clearCookie, res } = mockRes();

      clearAccessTokenCookie(res);

      expect(clearCookie).toHaveBeenCalledWith(ACCESS_TOKEN_COOKIE, {
        path: "/",
      });
      expect(clearCookie).toHaveBeenCalledWith(CSRF_TOKEN_COOKIE, {
        path: "/",
      });
      expect(clearCookie).not.toHaveBeenCalledWith(
        REFRESH_TOKEN_COOKIE,
        expect.anything(),
      );
    });
  });
});
