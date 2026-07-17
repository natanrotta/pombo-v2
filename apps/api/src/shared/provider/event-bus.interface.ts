export interface EventBusSubscription {
  unsubscribe(): Promise<void>;
}

export interface IEventBus {
  /** Best-effort publish to a channel. Implementations swallow transport errors. */
  publish(channel: string, payload: string): Promise<void>;

  /**
   * Subscribe a handler to a channel. The handler receives raw payloads —
   * domain typing happens above this interface. Returns a subscription
   * handle the caller MUST close (typically on request close).
   */
  subscribe(
    channel: string,
    handler: (payload: string) => void,
  ): Promise<EventBusSubscription>;

  shutdown(): Promise<void>;
}
