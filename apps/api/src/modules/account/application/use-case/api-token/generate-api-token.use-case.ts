import { inject, injectable } from "tsyringe";
import { DI_TOKENS } from "@core/container/tokens";
import { IApiTokenRepository } from "@modules/account/domain/repository/api-token-repository.interface";
import { generateApiToken } from "@modules/account/application/service/api-token.generator";

export interface GenerateApiTokenInput {
  accountId: string;
  userId: string;
}

/** Returned exactly once when a token is generated — carries the clear token. */
export interface GenerateApiTokenResponse {
  token: string;
}

/**
 * Issues a fresh public-API token for the account. Generating a new one
 * REVOKES the previous active token in the same transaction (invariant: at
 * most one active token per account). The clear token is returned exactly once
 * here and never again — only its SHA-256 hash is persisted (R22).
 */
@injectable()
export class GenerateApiTokenUseCase {
  constructor(
    @inject(DI_TOKENS.ApiTokenRepository)
    private readonly apiTokenRepository: IApiTokenRepository,
  ) {}

  async execute(
    input: GenerateApiTokenInput,
  ): Promise<GenerateApiTokenResponse> {
    const { token, tokenHash, tokenPrefix } = generateApiToken();

    await this.apiTokenRepository.rotate({
      accountId: input.accountId,
      tokenHash,
      tokenPrefix,
      createdByUserId: input.userId,
    });

    return { token };
  }
}
