import {
  IWhatsAppGateway,
  SendTextResult,
} from "@modules/devices/domain/provider/whatsapp-gateway.interface";

/**
 * In-memory WhatsApp gateway for specs — no real socket. Records calls and lets
 * a test drive connection state / jid resolution / send results. Mirrors the
 * enabled real gateway (`isEnabled()` → true) so the connect/send use cases run
 * their full logic.
 */
export class FakeWhatsAppGateway implements IWhatsAppGateway {
  public connectCalls: string[] = [];
  public logoutCalls: string[] = [];
  public sentTexts: { deviceId: string; jid: string; text: string }[] = [];

  private connected = new Set<string>();
  private jidByPhone = new Map<string, string | null>();
  private nextWaMessageId = 0;
  private enabled = true;

  // ── Test controls ────────────────────────────────────────────────────────
  setConnected(deviceId: string, value: boolean): void {
    if (value) this.connected.add(deviceId);
    else this.connected.delete(deviceId);
  }

  setJid(phone: string, jid: string | null): void {
    this.jidByPhone.set(phone, jid);
  }

  setEnabled(value: boolean): void {
    this.enabled = value;
  }

  // ── IWhatsAppGateway ─────────────────────────────────────────────────────
  isEnabled(): boolean {
    return this.enabled;
  }

  async connect(deviceId: string): Promise<void> {
    this.connectCalls.push(deviceId);
  }

  async disconnect(deviceId: string): Promise<void> {
    this.connected.delete(deviceId);
  }

  async logout(deviceId: string): Promise<void> {
    this.logoutCalls.push(deviceId);
    this.connected.delete(deviceId);
  }

  isConnected(deviceId: string): boolean {
    return this.connected.has(deviceId);
  }

  async resolveJid(_deviceId: string, phone: string): Promise<string | null> {
    // Default: echo a jid derived from the phone unless overridden.
    if (this.jidByPhone.has(phone)) return this.jidByPhone.get(phone) ?? null;
    return `${phone}@s.whatsapp.net`;
  }

  async sendText(
    deviceId: string,
    jid: string,
    text: string,
  ): Promise<SendTextResult> {
    this.sentTexts.push({ deviceId, jid, text });
    this.nextWaMessageId += 1;
    return { waMessageId: `wa-${this.nextWaMessageId}` };
  }
}
