import { RegisterDeviceDTOSchema, DeviceIdParamSchema } from "./device.dto";

describe("device DTOs", () => {
  describe("RegisterDeviceDTOSchema", () => {
    it("accepts a name and optional webhookUrl", () => {
      const parsed = RegisterDeviceDTOSchema.parse({
        name: "  my-phone  ",
        webhookUrl: "https://hook.example.com",
      });
      expect(parsed.name).toBe("my-phone"); // trimmed
      expect(parsed.webhookUrl).toBe("https://hook.example.com");
    });

    it("accepts a name with no webhookUrl", () => {
      const parsed = RegisterDeviceDTOSchema.parse({ name: "phone" });
      expect(parsed.webhookUrl).toBeUndefined();
    });

    it("rejects an empty name", () => {
      expect(() => RegisterDeviceDTOSchema.parse({ name: "" })).toThrow();
    });

    it("rejects a non-url webhookUrl", () => {
      expect(() =>
        RegisterDeviceDTOSchema.parse({
          name: "phone",
          webhookUrl: "not-a-url",
        }),
      ).toThrow();
    });
  });

  describe("DeviceIdParamSchema", () => {
    it("accepts a uuid", () => {
      const id = "11111111-1111-1111-1111-111111111111";
      expect(DeviceIdParamSchema.parse({ id }).id).toBe(id);
    });

    it("rejects a non-uuid", () => {
      expect(() => DeviceIdParamSchema.parse({ id: "nope" })).toThrow();
    });
  });
});
