import { Request, Response } from "express";
import { container } from "tsyringe";
import { AuthController } from "./auth.controller";
import { setAccessTokenCookie } from "@core/http/helpers/auth-cookies";
import { ErrorCodes } from "@shared/error/error-codes";

const mockExecute = vi.fn();

vi.mock("@core/config", () => ({
  env: {
    NODE_ENV: "test",
    API_PORT: 3333,
    ALLOWED_ORIGIN: "*",
    PROJECT_NAME: "test",
    LOG_LEVEL: "silent",
    DATABASE_URL: "postgresql://localhost:5432/test",
    JWT_SECRET: "test-secret",
    JWT_EXPIRES_IN: "15m",
    REFRESH_TOKEN_EXPIRES_IN: "30d",
    REDIS_HOST: "localhost",
    REDIS_PORT: 6379,
    REDIS_DB: 0,
    AWS_REGION: "us-east-1",
    COOKIE_DOMAIN: undefined,
  },
}));

vi.mock("@core/http/helpers/auth-cookies", () => ({
  setAuthCookies: vi.fn(),
  setAccessTokenCookie: vi.fn(),
  clearAuthCookies: vi.fn(),
  setCsrfCookie: vi.fn(),
  REFRESH_TOKEN_COOKIE: "boilerplate_rt",
  CSRF_TOKEN_COOKIE: "boilerplate_csrf",
  ACCESS_TOKEN_COOKIE: "boilerplate_at",
}));

vi.mock("tsyringe", async (importOriginal) => ({
  ...((await importOriginal()) as any),
  container: {
    resolve: vi.fn(() => ({ execute: mockExecute })),
  },
}));

function mockReqRes(overrides: Partial<Request> = {}) {
  const req = {
    body: {},
    auth: { userId: "u1", language: "pt-BR" },
    file: { buffer: Buffer.from("") },
    headers: {},
    cookies: {},
    ip: "127.0.0.1",
    ...overrides,
  } as unknown as Request;
  const json = vi.fn();
  const send = vi.fn();
  const status = vi.fn().mockReturnValue({ json, send });
  const cookie = vi.fn();
  const clearCookie = vi.fn();
  const res = {
    status,
    json,
    send,
    cookie,
    clearCookie,
  } as unknown as Response;
  return { req, res, status, json, send, cookie, clearCookie };
}

describe("AuthController", () => {
  const sut = new AuthController();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(container.resolve).mockImplementation(
      () => ({ execute: mockExecute }) as never,
    );
  });

  it("signIn should return 200 with data and set the access cookie", async () => {
    mockExecute.mockResolvedValue({
      user: { id: "u1" },
      token: "t",
      refreshToken: "rt",
    });
    const { req, res, status, json } = mockReqRes({
      body: { email: "a@b.com", password: "x" },
    });

    await sut.signIn(req, res);

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: true,
        data: expect.objectContaining({ token: "t" }),
      }),
    );
    expect(setAccessTokenCookie).toHaveBeenCalledWith(res, "t");
  });

  it("signUp should return 201 with data", async () => {
    mockExecute.mockResolvedValue({
      requiresEmailVerification: true,
      token: "t",
      email: "a@b.com",
    });
    const { req, res, status } = mockReqRes();

    await sut.signUp(req, res);

    expect(status).toHaveBeenCalledWith(201);
  });

  it("signOut should return 204", async () => {
    mockExecute.mockResolvedValue(undefined);
    const { req, res, status, send } = mockReqRes();

    await sut.signOut(req, res);

    expect(status).toHaveBeenCalledWith(204);
    expect(send).toHaveBeenCalled();
  });

  it("me should return 200 with data", async () => {
    mockExecute.mockResolvedValue({ id: "u1" });
    const { req, res, status } = mockReqRes();

    await sut.me(req, res);

    expect(status).toHaveBeenCalledWith(200);
  });

  it("updateProfile should return 200", async () => {
    mockExecute.mockResolvedValue({});
    const { req, res, status } = mockReqRes();

    await sut.updateProfile(req, res);

    expect(status).toHaveBeenCalledWith(200);
  });

  it("updateAvatar should return 200", async () => {
    mockExecute.mockResolvedValue({});
    const { req, res, status } = mockReqRes();

    await sut.updateAvatar(req, res);

    expect(status).toHaveBeenCalledWith(200);
  });

  it("googleSignIn should return 200 for kind=sign-in", async () => {
    mockExecute.mockResolvedValue({
      kind: "sign-in",
      user: { id: "u1" },
      token: "t",
      refreshToken: "rt",
    });
    const { req, res, status } = mockReqRes();

    await sut.googleSignIn(req, res);

    expect(status).toHaveBeenCalledWith(200);
  });

  it("googleSignIn should return 201 for kind=sign-up", async () => {
    mockExecute.mockResolvedValue({
      kind: "sign-up",
      user: { id: "u1" },
      token: "t",
      refreshToken: "rt",
    });
    const { req, res, status } = mockReqRes();

    await sut.googleSignIn(req, res);

    expect(status).toHaveBeenCalledWith(201);
  });

  it("refresh should return 200", async () => {
    mockExecute.mockResolvedValue({ token: "t", refreshToken: "rt" });
    const { req, res, status } = mockReqRes({ body: { refreshToken: "rt" } });

    await sut.refresh(req, res);

    expect(status).toHaveBeenCalledWith(200);
  });

  it("refresh reads the token from the boilerplate_rt cookie when the body is empty (canonical web path)", async () => {
    mockExecute.mockResolvedValue({ token: "t", refreshToken: "rt" });
    const { req, res, status } = mockReqRes({
      body: {},
      cookies: { boilerplate_rt: "cookie-rt" },
    });

    await sut.refresh(req, res);

    expect(mockExecute.mock.calls[0]![0]).toBe("cookie-rt");
    expect(status).toHaveBeenCalledWith(200);
  });

  it("refresh rejects AUTH_NO_TOKEN when neither cookie nor body carries a refresh token", async () => {
    const { req, res } = mockReqRes({ body: {}, cookies: {} });

    await expect(sut.refresh(req, res)).rejects.toMatchObject({
      code: ErrorCodes.AUTH_NO_TOKEN,
    });
    expect(mockExecute).not.toHaveBeenCalled();
  });

  it("sendEmailVerificationPin should return 204", async () => {
    mockExecute.mockResolvedValue(undefined);
    const { req, res, status, send } = mockReqRes({
      emailVerifyAuth: { userId: "u1" },
    } as Partial<Request>);

    await sut.sendEmailVerificationPin(req, res);

    expect(status).toHaveBeenCalledWith(204);
    expect(send).toHaveBeenCalled();
  });

  it("verifyEmailPin should return 200 with the upgraded session", async () => {
    mockExecute.mockResolvedValue({
      user: { id: "u1" },
      token: "t",
      refreshToken: "rt",
    });
    const { req, res, status, json } = mockReqRes({
      emailVerifyAuth: { userId: "u1" },
      body: { pin: "123456" },
    } as Partial<Request>);

    await sut.verifyEmailPin(req, res);

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: true,
        data: expect.objectContaining({ token: "t" }),
      }),
    );
  });

  it("sendEmailVerificationPin throws when the scoped auth context is missing", async () => {
    const { req, res } = mockReqRes({
      emailVerifyAuth: undefined,
    } as Partial<Request>);
    await expect(sut.sendEmailVerificationPin(req, res)).rejects.toMatchObject({
      code: "AUTH_NO_TOKEN",
    });
  });

  it("verifyEmailPin throws when the scoped auth context is missing", async () => {
    const { req, res } = mockReqRes({
      emailVerifyAuth: undefined,
      body: { pin: "123456" },
    } as Partial<Request>);
    await expect(sut.verifyEmailPin(req, res)).rejects.toMatchObject({
      code: "AUTH_NO_TOKEN",
    });
  });
});
