import { createHmac } from "node:crypto";
import { signWebhook } from "./hmac-signer";

describe("signWebhook", () => {
  it("produces a sha256=<hex> HMAC over `${timestamp}.${rawBody}`", () => {
    const rawBody = JSON.stringify({ hello: "world" });
    const timestamp = 1_700_000_000;
    const secret = "device-secret";

    const expected = `sha256=${createHmac("sha256", secret)
      .update(`${timestamp}.${rawBody}`)
      .digest("hex")}`;

    expect(signWebhook(rawBody, timestamp, secret)).toBe(expected);
  });

  it("changes when the timestamp changes (anti-replay)", () => {
    const body = "{}";
    const a = signWebhook(body, 1, "s");
    const b = signWebhook(body, 2, "s");
    expect(a).not.toBe(b);
  });

  it("changes when the secret changes", () => {
    const body = "{}";
    expect(signWebhook(body, 1, "s1")).not.toBe(signWebhook(body, 1, "s2"));
  });
});
