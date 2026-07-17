import { Request, Response } from "express";
import { PublicApiController } from "./public-api.controller";
import { UnauthorizedError } from "@shared/error";

const mockExecute = vi.fn();

vi.mock("tsyringe", async (importOriginal) => ({
  ...((await importOriginal()) as object),
  container: {
    resolve: vi.fn(() => ({ execute: mockExecute })),
  },
}));

function mockReqRes(overrides: Partial<Request> = {}) {
  const headers: Record<string, string> = {};
  const req = {
    body: {},
    params: {},
    apiAuth: { accountId: "acc-1", tokenId: "tok-1" },
    header: (name: string) => headers[name.toLowerCase()],
    __setHeader: (name: string, value: string) => {
      headers[name.toLowerCase()] = value;
    },
    ...overrides,
  } as unknown as Request & {
    __setHeader: (name: string, value: string) => void;
  };
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  const res = { status, json } as unknown as Response;
  return { req, res, status, json };
}

describe("PublicApiController", () => {
  let controller: PublicApiController;

  beforeEach(() => {
    controller = new PublicApiController();
    vi.clearAllMocks();
  });

  it("listDevices scopes by the token account and returns the public projection", async () => {
    mockExecute.mockResolvedValue([
      {
        id: "d1",
        name: "phone",
        identifier: "5599",
        status: "CONNECTED",
        webhooks: { onConnect: "https://secret-hook" },
        lastConnectedAt: "2026-01-01T00:00:00.000Z",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-02T00:00:00.000Z",
      },
    ]);
    const { req, res, status, json } = mockReqRes();

    await controller.listDevices(req, res);

    expect(mockExecute).toHaveBeenCalledWith("acc-1");
    expect(status).toHaveBeenCalledWith(200);
    // Projection strips webhooks + updatedAt.
    expect(json).toHaveBeenCalledWith({
      ok: true,
      data: [
        {
          id: "d1",
          name: "phone",
          identifier: "5599",
          status: "CONNECTED",
          lastConnectedAt: "2026-01-01T00:00:00.000Z",
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    });
  });

  it("sendText maps message→text, passes the header Idempotency-Key, and returns 202", async () => {
    mockExecute.mockResolvedValue({ messageId: "m1", status: "PENDING" });
    const { req, res, status } = mockReqRes({ params: { deviceId: "d1" } });
    req.__setHeader("Idempotency-Key", "key-1");
    req.body = { phone: "5548999999999", message: "oi" };

    await controller.sendText(req, res);

    expect(mockExecute).toHaveBeenCalledWith({
      accountId: "acc-1",
      deviceId: "d1",
      phone: "5548999999999",
      text: "oi",
      idempotencyKey: "key-1",
    });
    expect(status).toHaveBeenCalledWith(202);
  });

  it("sendText generates an Idempotency-Key when the header is absent", async () => {
    mockExecute.mockResolvedValue({ messageId: "m1", status: "PENDING" });
    const { req, res } = mockReqRes({ params: { deviceId: "d1" } });
    req.body = { phone: "5548999999999", message: "oi" };

    await controller.sendText(req, res);

    const call = mockExecute.mock.calls[0]![0] as { idempotencyKey: string };
    expect(call.idempotencyKey).toBeTruthy();
    expect(call.idempotencyKey.length).toBeGreaterThan(0);
  });

  it("fails closed with API_TOKEN_MISSING when apiAuth is absent", async () => {
    const { req, res } = mockReqRes({
      apiAuth: undefined,
    } as unknown as Partial<Request>);

    await expect(controller.listDevices(req, res)).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });
});
