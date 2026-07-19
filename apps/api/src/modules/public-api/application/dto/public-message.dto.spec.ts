import {
  SendTextPublicDTOSchema,
  SendImagePublicDTOSchema,
  SendAudioPublicDTOSchema,
  SendVideoPublicDTOSchema,
  PublicDeviceIdParamSchema,
} from "./public-message.dto";

describe("public message DTOs", () => {
  describe("SendTextPublicDTOSchema", () => {
    it("accepts an E.164 phone (with or without +) and a message", () => {
      expect(
        SendTextPublicDTOSchema.parse({
          phone: "5548999999999",
          message: "oi",
        }).phone,
      ).toBe("5548999999999");
      expect(
        SendTextPublicDTOSchema.parse({
          phone: "+5548999999999",
          message: "oi",
        }).phone,
      ).toBe("+5548999999999");
    });

    it("rejects a non-E.164 phone", () => {
      expect(() =>
        SendTextPublicDTOSchema.parse({ phone: "abc", message: "oi" }),
      ).toThrow();
      expect(() =>
        SendTextPublicDTOSchema.parse({ phone: "0123", message: "oi" }),
      ).toThrow();
    });

    it("rejects an empty message and one longer than 4096 chars", () => {
      expect(() =>
        SendTextPublicDTOSchema.parse({ phone: "5548999999999", message: "" }),
      ).toThrow();
      expect(() =>
        SendTextPublicDTOSchema.parse({
          phone: "5548999999999",
          message: "x".repeat(4097),
        }),
      ).toThrow();
    });
  });

  describe("rich public DTOs", () => {
    it("SendImagePublicDTOSchema enforces E.164 phone and requires image", () => {
      expect(
        SendImagePublicDTOSchema.parse({
          phone: "5548999999999",
          image: "https://ex.com/a.png",
        }).image,
      ).toBe("https://ex.com/a.png");
      expect(() =>
        SendImagePublicDTOSchema.parse({ phone: "abc", image: "x" }),
      ).toThrow();
      expect(() =>
        SendImagePublicDTOSchema.parse({ phone: "5548999999999" }),
      ).toThrow();
    });

    it("SendAudioPublicDTOSchema requires audio and enforces E.164 phone", () => {
      expect(
        SendAudioPublicDTOSchema.parse({
          phone: "5548999999999",
          audio: "https://ex.com/a.ogg",
        }).audio,
      ).toBe("https://ex.com/a.ogg");
      expect(() =>
        SendAudioPublicDTOSchema.parse({ phone: "5548999999999" }),
      ).toThrow();
      expect(() =>
        SendAudioPublicDTOSchema.parse({ phone: "abc", audio: "x" }),
      ).toThrow();
    });

    it("SendVideoPublicDTOSchema requires video", () => {
      expect(
        SendVideoPublicDTOSchema.parse({
          phone: "5548999999999",
          video: "https://ex.com/a.mp4",
        }).video,
      ).toBe("https://ex.com/a.mp4");
      expect(() =>
        SendVideoPublicDTOSchema.parse({ phone: "5548999999999" }),
      ).toThrow();
    });
  });

  describe("PublicDeviceIdParamSchema", () => {
    it("accepts a uuid and rejects a non-uuid", () => {
      const id = "11111111-1111-1111-1111-111111111111";
      expect(PublicDeviceIdParamSchema.parse({ deviceId: id }).deviceId).toBe(
        id,
      );
      expect(() =>
        PublicDeviceIdParamSchema.parse({ deviceId: "nope" }),
      ).toThrow();
    });
  });
});
