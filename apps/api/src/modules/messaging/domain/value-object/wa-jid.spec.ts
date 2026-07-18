import { buildUserJid, userJidToPhone } from "./wa-jid";

describe("buildUserJid", () => {
  it("builds a canonical user JID from bare digits", () => {
    expect(buildUserJid("5511999999999")).toBe("5511999999999@s.whatsapp.net");
  });

  it("strips any phone mask (+, spaces, parens, dashes)", () => {
    expect(buildUserJid("+55 (11) 99999-9999")).toBe(
      "5511999999999@s.whatsapp.net",
    );
  });
});

describe("userJidToPhone", () => {
  it("recovers the phone digits from a user JID", () => {
    expect(userJidToPhone("5511999999999@s.whatsapp.net")).toBe(
      "5511999999999",
    );
  });

  it("round-trips with buildUserJid", () => {
    const phone = "5511999999999";
    expect(userJidToPhone(buildUserJid(phone))).toBe(phone);
  });
});
