import type {
  SendTextInput,
  SendMessageResult,
} from "@/modules/messaging/domain/entities/Message";

export interface MessagingRepository {
  sendText(
    deviceId: string,
    input: SendTextInput,
  ): Promise<SendMessageResult>;
}
