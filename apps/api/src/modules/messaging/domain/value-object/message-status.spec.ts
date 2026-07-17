import { canTransitionTo } from "./message-status";

describe("canTransitionTo", () => {
  it("rises through the ack chain", () => {
    expect(canTransitionTo("PENDING", "SERVER_ACK")).toBe(true);
    expect(canTransitionTo("SERVER_ACK", "DELIVERY_ACK")).toBe(true);
    expect(canTransitionTo("DELIVERY_ACK", "READ")).toBe(true);
  });

  it("never regresses — out-of-order acks are ignored", () => {
    expect(canTransitionTo("READ", "SERVER_ACK")).toBe(false);
    expect(canTransitionTo("DELIVERY_ACK", "SERVER_ACK")).toBe(false);
    expect(canTransitionTo("SERVER_ACK", "SERVER_ACK")).toBe(false);
  });

  it("allows FAILED from anything except READ", () => {
    expect(canTransitionTo("PENDING", "FAILED")).toBe(true);
    expect(canTransitionTo("DELIVERY_ACK", "FAILED")).toBe(true);
    expect(canTransitionTo("READ", "FAILED")).toBe(false);
  });
});
