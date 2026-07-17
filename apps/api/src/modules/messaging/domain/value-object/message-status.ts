/**
 * The message-delivery status vocabulary + the monotonic transition rule.
 * Mirrors the Prisma `message_status` enum.
 */
export type MessageStatus =
  "PENDING" | "SERVER_ACK" | "DELIVERY_ACK" | "READ" | "FAILED";

const RANK: Record<MessageStatus, number> = {
  PENDING: 0,
  SERVER_ACK: 1,
  DELIVERY_ACK: 2,
  READ: 3,
  FAILED: 4,
};

/** Every status, for computing the "allowed-from" set of a transition. */
export const MESSAGE_STATUSES: readonly MessageStatus[] = [
  "PENDING",
  "SERVER_ACK",
  "DELIVERY_ACK",
  "READ",
  "FAILED",
];

/**
 * Pure domain rule. Protects against out-of-order acks: status only rises
 * (PENDING → SERVER_ACK → DELIVERY_ACK → READ); FAILED is allowed from anything
 * except READ. A `read` arriving before a `delivery_ack` must not regress.
 */
export const canTransitionTo = (
  from: MessageStatus,
  to: MessageStatus,
): boolean => (to === "FAILED" ? from !== "READ" : RANK[to] > RANK[from]);
