import { Request, Response } from "express";
import { container } from "tsyringe";
import {
  GenerateApiTokenUseCase,
  GetApiTokenMetadataUseCase,
} from "@modules/account/application/use-case/api-token";

/**
 * Account settings — the API-token surface (JWT-gated; see `account.routes.ts`).
 * The token is scoped to the caller's account. All responses use the
 * `{ ok, data }` envelope.
 */
export class AccountController {
  async getApiToken(req: Request, res: Response): Promise<Response> {
    const useCase = container.resolve(GetApiTokenMetadataUseCase);
    const result = await useCase.execute(req.auth.accountId);
    return res.status(200).json({ ok: true, data: result });
  }

  async generateApiToken(req: Request, res: Response): Promise<Response> {
    const useCase = container.resolve(GenerateApiTokenUseCase);
    const result = await useCase.execute({
      accountId: req.auth.accountId,
      userId: req.auth.userId,
    });
    // 201: a new credential was created (and the previous one revoked). The
    // clear token is in `data.token` — shown to the user exactly once.
    return res.status(201).json({ ok: true, data: result });
  }
}
