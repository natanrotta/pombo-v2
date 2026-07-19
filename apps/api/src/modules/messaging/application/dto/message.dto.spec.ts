import {
  SendMessageDTOSchema,
  SendImageDTOSchema,
  SendAudioDTOSchema,
  SendVideoDTOSchema,
  SendDocumentDTOSchema,
  SendMessageParamSchema,
  MessageIdParamSchema,
} from "./message.dto";

describe("message DTOs", () => {
  describe("SendMessageDTOSchema", () => {
    it("accepts a phone and text, trimming both", () => {
      const parsed = SendMessageDTOSchema.parse({
        phone: "  5548999999999  ",
        text: "  oi  ",
      });
      expect(parsed.phone).toBe("5548999999999");
      expect(parsed.text).toBe("oi");
    });

    it("rejects an empty text", () => {
      expect(() =>
        SendMessageDTOSchema.parse({ phone: "5548999999999", text: "" }),
      ).toThrow();
    });

    it("rejects a too-short phone", () => {
      expect(() =>
        SendMessageDTOSchema.parse({ phone: "12", text: "oi" }),
      ).toThrow();
    });
  });

  describe("rich send DTOs", () => {
    it("SendImageDTOSchema accepts phone + image and an optional caption", () => {
      const parsed = SendImageDTOSchema.parse({
        phone: "5548999999999",
        image: "https://ex.com/a.png",
        caption: "hi",
      });
      expect(parsed.image).toBe("https://ex.com/a.png");
      expect(parsed.caption).toBe("hi");
    });

    it("SendImageDTOSchema rejects a missing image", () => {
      expect(() =>
        SendImageDTOSchema.parse({ phone: "5548999999999" }),
      ).toThrow();
    });

    it("SendAudioDTOSchema accepts phone + audio and rejects a missing audio", () => {
      expect(
        SendAudioDTOSchema.parse({
          phone: "5548999999999",
          audio: "https://ex.com/a.ogg",
        }).audio,
      ).toBe("https://ex.com/a.ogg");
      expect(() =>
        SendAudioDTOSchema.parse({ phone: "5548999999999" }),
      ).toThrow();
    });

    it("SendVideoDTOSchema accepts phone + video and rejects a missing video", () => {
      expect(
        SendVideoDTOSchema.parse({
          phone: "5548999999999",
          video: "https://ex.com/a.mp4",
        }).video,
      ).toBe("https://ex.com/a.mp4");
      expect(() =>
        SendVideoDTOSchema.parse({ phone: "5548999999999" }),
      ).toThrow();
    });

    it("SendDocumentDTOSchema accepts optional fileName + caption", () => {
      const parsed = SendDocumentDTOSchema.parse({
        phone: "5548999999999",
        document: "https://ex.com/a.pdf",
      });
      expect(parsed.fileName).toBeUndefined();
    });
  });

  it("SendMessageParamSchema requires a uuid device id", () => {
    expect(() => SendMessageParamSchema.parse({ id: "nope" })).toThrow();
  });

  it("MessageIdParamSchema requires a uuid message id", () => {
    const id = "11111111-1111-1111-1111-111111111111";
    expect(MessageIdParamSchema.parse({ id }).id).toBe(id);
  });
});
