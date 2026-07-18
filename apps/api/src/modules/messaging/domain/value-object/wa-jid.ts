// The WhatsApp individual-user server suffix. A user JID is `<digits>@<server>`.
const USER_SERVER = "s.whatsapp.net";

/**
 * Build the canonical WhatsApp user JID from a phone number.
 *
 * Used to enqueue a send while the device is OFFLINE: we can't call
 * `onWhatsApp` to resolve/validate the JID with no live socket, so we construct
 * it and defer the "is on WhatsApp?" check to drain time. Strips any mask
 * (spaces, `+`, `()`, `-`) so `+55 (11) 99999-9999` → `5511999999999@s.whatsapp.net`.
 */
export const buildUserJid = (phone: string): string =>
  `${phone.replace(/\D/g, "")}@${USER_SERVER}`;

/** Recover the phone (digits) from a user JID — for the `message.sent` event,
 *  which carries the phone, not the JID. */
export const userJidToPhone = (jid: string): string => jid.split("@")[0] ?? "";
