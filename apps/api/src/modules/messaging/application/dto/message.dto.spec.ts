import {
  SendMessageDTOSchema,
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

  it("SendMessageParamSchema requires a uuid device id", () => {
    expect(() => SendMessageParamSchema.parse({ id: "nope" })).toThrow();
  });

  it("MessageIdParamSchema requires a uuid message id", () => {
    const id = "11111111-1111-1111-1111-111111111111";
    expect(MessageIdParamSchema.parse({ id }).id).toBe(id);
  });
});
