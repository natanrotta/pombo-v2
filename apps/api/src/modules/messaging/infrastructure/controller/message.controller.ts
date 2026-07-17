import { Request, Response } from "express";
import { container } from "tsyringe";
import {
  SendTextMessageUseCase,
  GetMessageStatusUseCase,
} from "@modules/messaging/application/use-case/messages";
import { BadRequestError } from "@shared/error";
import { ErrorCodes } from "@shared/error/error-codes";

/**
 * Messaging endpoints (send a text, poll a message's status). Both sit behind
 * the JWT auth middleware — see `message.routes.ts`. `202` = accepted + socket
 * alive, NOT delivered.
 */
export class MessageController {
  async send(req: Request, res: Response): Promise<Response> {
    const { id } = req.params as { id: string };
    const idempotencyKey = req.header("idempotency-key");
    if (!idempotencyKey || idempotencyKey.trim().length === 0) {
      throw new BadRequestError(
        "The Idempotency-Key header is required",
        undefined,
        ErrorCodes.BAD_REQUEST,
      );
    }

    const useCase = container.resolve(SendTextMessageUseCase);
    const result = await useCase.execute({
      deviceId: id,
      phone: req.body.phone,
      text: req.body.text,
      idempotencyKey,
    });
    return res.status(202).json({ ok: true, data: result });
  }

  async getStatus(req: Request, res: Response): Promise<Response> {
    const { id } = req.params as { id: string };
    const useCase = container.resolve(GetMessageStatusUseCase);
    const result = await useCase.execute(id);
    return res.status(200).json({ ok: true, data: result });
  }
}
