import type {
  SendTextInput,
  SendImageInput,
  SendAudioInput,
  SendVideoInput,
  SendDocumentInput,
  SendPixInput,
  SendListInput,
  SendMessageResult,
  MessageStatusResult,
} from "@/modules/messaging/domain/entities/Message";

export interface MessagingRepository {
  sendText(deviceId: string, input: SendTextInput): Promise<SendMessageResult>;
  sendImage(
    deviceId: string,
    input: SendImageInput,
  ): Promise<SendMessageResult>;
  sendAudio(
    deviceId: string,
    input: SendAudioInput,
  ): Promise<SendMessageResult>;
  sendVideo(
    deviceId: string,
    input: SendVideoInput,
  ): Promise<SendMessageResult>;
  sendDocument(
    deviceId: string,
    input: SendDocumentInput,
  ): Promise<SendMessageResult>;
  sendPix(deviceId: string, input: SendPixInput): Promise<SendMessageResult>;
  sendList(deviceId: string, input: SendListInput): Promise<SendMessageResult>;
  getStatus(messageId: string): Promise<MessageStatusResult>;
}
