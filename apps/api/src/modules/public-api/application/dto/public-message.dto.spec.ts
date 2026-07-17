import {
  SendTextPublicDTOSchema,
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
