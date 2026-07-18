import { describe, it, expect } from "vitest";
import { buildPostmanCollection } from "./postmanCollection";

describe("buildPostmanCollection", () => {
  const collection = buildPostmanCollection("https://api.example.com/api/v1");

  it("uses the Postman v2.1 schema and collection-level Bearer auth", () => {
    expect(collection.info.schema).toContain("v2.1.0");
    expect(collection.auth.type).toBe("bearer");
    expect(collection.auth.bearer[0]?.value).toBe("{{token}}");
  });

  it("seeds the environment variables (baseUrl defaulted, others empty)", () => {
    const vars = Object.fromEntries(
      collection.variable.map((v) => [v.key, v.value]),
    );
    expect(vars.baseUrl).toBe("https://api.example.com/api/v1");
    expect(vars).toHaveProperty("token", "");
    expect(vars).toHaveProperty("deviceId", "");
    expect(vars).toHaveProperty("phone", "");
  });

  it("includes list-devices and all 7 send endpoints", () => {
    const requests = collection.item.flatMap((folder) =>
      (folder.item ?? []).map((entry) => ({
        name: entry.name,
        method: entry.request?.method,
        path: entry.request?.url.path.join("/"),
      })),
    );
    const paths = requests.map((r) => r.path);
    expect(paths).toContain("devices");
    for (const type of [
      "send-text",
      "send-image",
      "send-audio",
      "send-video",
      "send-document",
      "send-pix",
      "send-list",
    ]) {
      expect(paths).toContain(`devices/{{deviceId}}/${type}`);
    }
  });

  it("uses the {{phone}} variable in send bodies", () => {
    const sendText = collection.item
      .flatMap((f) => f.item ?? [])
      .find((entry) => entry.name === "Send text");
    expect(sendText?.request?.body?.raw).toContain("{{phone}}");
  });
});
