import { inject, injectable } from "tsyringe";
import { DI_TOKENS } from "@core/container/tokens";
import { IOutboxRepository } from "@modules/messaging/domain/repository/outbox-repository.interface";
import { OutboxMessage } from "@modules/messaging/domain/entity/outbox-message.entity";
import { NotFoundError } from "@shared/error";
import { ErrorCodes } from "@shared/error/error-codes";

type MessageStatusResponse = ReturnType<OutboxMessage["toJSON"]>;

/**
 * The authoritative status of a message. `202` never meant delivered — this is
 * how the consumer polls the real state (the webhook is only a convenience).
 */
@injectable()
export class GetMessageStatusUseCase {
  constructor(
    @inject(DI_TOKENS.OutboxRepository)
    private readonly outboxRepository: IOutboxRepository,
  ) {}

  async execute(id: string): Promise<MessageStatusResponse> {
    const message = await this.outboxRepository.findById(id);
    if (!message) {
      throw new NotFoundError(
        "Message not found",
        undefined,
        ErrorCodes.MESSAGE_NOT_FOUND,
      );
    }
    return message.toJSON();
  }
}
