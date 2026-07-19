import { randomUUID } from "node:crypto";
import { Request, Response } from "express";
import { container } from "tsyringe";
import { ListDevicesUseCase } from "@modules/devices/application/use-case/devices";
import {
  SendTextMessageUseCase,
  SendRichMessageUseCase,
} from "@modules/messaging/application/use-case/messages";
import { type RichMessageType } from "@modules/messaging/domain/value-object/message-type";
import { UnauthorizedError } from "@shared/error";
import { ErrorCodes } from "@shared/error/error-codes";

/**
 * The public `/api/v1` surface consumed by external integrations with a `pmb_`
 * API token. Thin: it REUSES the internal use cases (list devices, send text) —
 * no duplicated logic — scoping everything to the token's account
 * (`req.apiAuth.accountId`). All responses use the `{ ok, data }` envelope.
 */
export class PublicApiController {
  private accountId(req: Request): string {
    // apiTokenAuthMiddleware guarantees this; guard defensively so a wiring
    // mistake fails closed rather than scoping to `undefined`.
    if (!req.apiAuth) {
      throw new UnauthorizedError(
        "Missing API token",
        undefined,
        ErrorCodes.API_TOKEN_MISSING,
      );
    }
    return req.apiAuth.accountId;
  }

  async listDevices(req: Request, res: Response): Promise<Response> {
    const useCase = container.resolve(ListDevicesUseCase);
    const devices = await useCase.execute(this.accountId(req));
    // Public projection — no webhook config / updatedAt on the list surface.
    const data = devices.map((device) => ({
      id: device.id,
      name: device.name,
      identifier: device.identifier,
      status: device.status,
      lastConnectedAt: device.lastConnectedAt,
      createdAt: device.createdAt,
    }));
    return res.status(200).json({ ok: true, data });
  }

  async sendText(req: Request, res: Response): Promise<Response> {
    const { deviceId } = req.params as { deviceId: string };
    const useCase = container.resolve(SendTextMessageUseCase);
    const result = await useCase.execute({
      accountId: this.accountId(req),
      deviceId,
      phone: req.body.phone,
      text: req.body.message,
      idempotencyKey: this.idempotencyKey(req),
    });
    return res.status(202).json({ ok: true, data: result });
  }

  sendImage = (req: Request, res: Response): Promise<Response> =>
    this.sendRich(req, res, "image");
  sendAudio = (req: Request, res: Response): Promise<Response> =>
    this.sendRich(req, res, "audio");
  sendVideo = (req: Request, res: Response): Promise<Response> =>
    this.sendRich(req, res, "video");
  sendDocument = (req: Request, res: Response): Promise<Response> =>
    this.sendRich(req, res, "document");

  /** Shared rich-send path — reuses the internal `SendRichMessageUseCase`, same
   *  as `sendText`. The body was validated by the route's per-type Zod schema. */
  private async sendRich(
    req: Request,
    res: Response,
    type: RichMessageType,
  ): Promise<Response> {
    const { deviceId } = req.params as { deviceId: string };
    const { phone, ...payload } = req.body as {
      phone: string;
      [key: string]: unknown;
    };

    const useCase = container.resolve(SendRichMessageUseCase);
    const result = await useCase.execute({
      accountId: this.accountId(req),
      deviceId,
      phone,
      idempotencyKey: this.idempotencyKey(req),
      type,
      payload,
    });
    return res.status(202).json({ ok: true, data: result });
  }

  // Idempotency-Key is OPTIONAL on the public surface — generate one when the
  // caller omits it so every send still gets an idempotency guard.
  private idempotencyKey(req: Request): string {
    return req.header("idempotency-key")?.trim() || randomUUID();
  }
}
