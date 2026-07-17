import { Request } from "express";

vi.mock("../../config", () => ({
  env: {
    NODE_ENV: "development",
    REFRESH_TOKEN_EXPIRES_IN: "30d",
    COOKIE_DOMAIN: undefined,
  },
}));
vi.mock("@shared/util/parse-expires-in", () => ({
  parseExpiresIn: vi.fn(() => 2_592_000_000),
}));

import { extractRequestToken } from "./extract-request-token";
import { ACCESS_TOKEN_COOKIE } from "./auth-cookies";

function mockReq(overrides: {
  authorization?: string;
  cookies?: Record<string, unknown>;
}): Request {
  return {
    headers: overrides.authorization
      ? { authorization: overrides.authorization }
      : {},
    cookies: overrides.cookies ?? {},
  } as unknown as Request;
}

describe("extractRequestToken", () => {
  it("returns the token from a Bearer Authorization header", () => {
    expect(
      extractRequestToken(mockReq({ authorization: "Bearer abc.def.ghi" })),
    ).toBe("abc.def.ghi");
  });

  it("falls back to the pombo_at cookie when there is no header", () => {
    expect(
      extractRequestToken(
        mockReq({ cookies: { [ACCESS_TOKEN_COOKIE]: "cookie.jwt" } }),
      ),
    ).toBe("cookie.jwt");
  });

  it("prefers the Bearer header over the cookie when both are present", () => {
    expect(
      extractRequestToken(
        mockReq({
          authorization: "Bearer header.jwt",
          cookies: { [ACCESS_TOKEN_COOKIE]: "cookie.jwt" },
        }),
      ),
    ).toBe("header.jwt");
  });

  it("returns null when neither header nor cookie carries a token", () => {
    expect(extractRequestToken(mockReq({}))).toBeNull();
  });

  it("ignores a non-Bearer Authorization header and falls back to the cookie", () => {
    expect(
      extractRequestToken(
        mockReq({
          authorization: "Basic xyz",
          cookies: { [ACCESS_TOKEN_COOKIE]: "cookie.jwt" },
        }),
      ),
    ).toBe("cookie.jwt");
  });

  it("returns null for an empty-string cookie value", () => {
    expect(
      extractRequestToken(mockReq({ cookies: { [ACCESS_TOKEN_COOKIE]: "" } })),
    ).toBeNull();
  });
});
