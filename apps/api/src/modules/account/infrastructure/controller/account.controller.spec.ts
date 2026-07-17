import { Request, Response } from "express";
import { AccountController } from "./account.controller";

const mockExecute = vi.fn();

vi.mock("tsyringe", async (importOriginal) => ({
  ...((await importOriginal()) as object),
  container: {
    resolve: vi.fn(() => ({ execute: mockExecute })),
  },
}));

function mockReqRes(overrides: Partial<Request> = {}) {
  const req = {
    body: {},
    params: {},
    headers: {},
    auth: { userId: "u-1", accountId: "acc-1", language: "pt-BR" },
    ...overrides,
  } as unknown as Request;
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  const res = { status, json } as unknown as Response;
  return { req, res, status, json };
}

describe("AccountController", () => {
  let controller: AccountController;

  beforeEach(() => {
    controller = new AccountController();
    vi.clearAllMocks();
  });

  it("getApiToken → 200 with the metadata (or null) for the account", async () => {
    mockExecute.mockResolvedValue({
      prefix: "pmb_a1b2…9f3c",
      createdAt: "2026-01-01T00:00:00.000Z",
      lastUsedAt: null,
    });
    const { req, res, status, json } = mockReqRes();

    await controller.getApiToken(req, res);

    expect(mockExecute).toHaveBeenCalledWith("acc-1");
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({
      ok: true,
      data: {
        prefix: "pmb_a1b2…9f3c",
        createdAt: "2026-01-01T00:00:00.000Z",
        lastUsedAt: null,
      },
    });
  });

  it("generateApiToken → 201 with the clear token", async () => {
    mockExecute.mockResolvedValue({ token: "pmb_deadbeef" });
    const { req, res, status, json } = mockReqRes();

    await controller.generateApiToken(req, res);

    expect(mockExecute).toHaveBeenCalledWith({
      accountId: "acc-1",
      userId: "u-1",
    });
    expect(status).toHaveBeenCalledWith(201);
    expect(json).toHaveBeenCalledWith({
      ok: true,
      data: { token: "pmb_deadbeef" },
    });
  });
});
