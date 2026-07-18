import type {
  SendTextInput,
  SendMessageResult,
  MessageStatusResult,
} from "@/modules/messaging/domain/entities/Message";

export interface MessagingRepository {
  sendText(
    deviceId: string,
    input: SendTextInput,
  ): Promise<SendMessageResult>;
  getStatus(messageId: string): Promise<MessageStatusResult>;
}
