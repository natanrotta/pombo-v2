import { inject, injectable } from "tsyringe";
import { DI_TOKENS } from "@core/container/tokens";
import {
  Device,
  type DeviceWebhooks,
} from "@modules/devices/domain/entity/device.entity";
import {
  IDevicesRepository,
  CreateDeviceData,
  UpdateDeviceWebhooksData,
} from "@modules/devices/domain/repository/devices-repository.interface";
import { type DeviceStatus } from "@modules/devices/domain/value-object/device-status";
import { PrismaDevicesRepository } from "./prisma-devices.repository";
import type { ICacheProvider } from "@shared/provider/cache-provider.interface";
import type { AppConfig } from "@shared/provider/app-config.interface";
import {
  withCache,
  invalidateCache,
  type CacheCodec,
} from "@shared/util/with-cache";

interface SerializedDevice {
  id: string;
  accountId: string;
  name: string;
  identifier: string | null;
  status: DeviceStatus;
  webhookSecret: string | null;
  webhooks: DeviceWebhooks;
  lastConnectedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Device ↔ cache codec. All props are read via getters; dates round-trip as ISO
// strings. The webhookSecret is included (needed by the webhook dispatcher) —
// it only ever lives in the trusted internal Redis, never in a log (R22).
const deviceCodec: CacheCodec<Device> = {
  serialize: (d): SerializedDevice => ({
    id: d.id,
    accountId: d.accountId,
    name: d.name,
    identifier: d.identifier,
    status: d.status,
    webhookSecret: d.webhookSecret,
    webhooks: d.webhooks,
    lastConnectedAt: d.lastConnectedAt ? d.lastConnectedAt.toISOString() : null,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  }),
  deserialize: (raw): Device => {
    const r = raw as SerializedDevice;
    return new Device({
      id: r.id,
      accountId: r.accountId,
      name: r.name,
      identifier: r.identifier,
      status: r.status,
      webhookSecret: r.webhookSecret,
      webhooks: r.webhooks,
      lastConnectedAt: r.lastConnectedAt ? new Date(r.lastConnectedAt) : null,
      createdAt: new Date(r.createdAt),
      updatedAt: new Date(r.updatedAt),
    });
  },
};

/**
 * Read-aside cache decorator over `PrismaDevicesRepository` (BASELINE R8 — it
 * IS the domain interface; the cache is invisible above it). Caches the single
 * device row by id (`device:{id}`) — the two hottest reads (`findById` on send,
 * `findByIdInternal` on every webhook dispatch) share the entry. Writes evict
 * the key. Everything else delegates. Fail-open: a Redis outage degrades to the
 * Prisma repo.
 */
@injectable()
export class CachedDevicesRepository implements IDevicesRepository {
  constructor(
    // Injected as the concrete Prisma repo; typed as the interface so the
    // decorator depends on the port, not the impl (and is trivially faked).
    @inject(PrismaDevicesRepository)
    private readonly inner: IDevicesRepository,
    @inject(DI_TOKENS.CacheProvider)
    private readonly cache: ICacheProvider,
    @inject(DI_TOKENS.AppConfig)
    private readonly config: AppConfig,
  ) {}

  private key(id: string): string {
    return `device:${id}`;
  }

  private load(id: string): Promise<Device | null> {
    return withCache(
      this.cache,
      this.key(id),
      this.config.CACHE_ENTITY_TTL_SECONDS,
      () => this.inner.findByIdInternal(id),
      deviceCodec,
    );
  }

  async findById(accountId: string, id: string): Promise<Device | null> {
    // Cached by id; tenancy (R1) is enforced by an in-memory account check —
    // the cross-account result is identical to a scoped query (null), with no
    // leak, and the entry is shared with findByIdInternal.
    // @security Correct while Redis is single-tenant per deployment (the norm
    // here). If Redis is ever shared across tenants, switch the key to
    // `device:{accountId}:{id}` so an entry can't cross a tenant boundary.
    const device = await this.load(id);
    return device && device.accountId === accountId ? device : null;
  }

  findByIdInternal(id: string): Promise<Device | null> {
    return this.load(id);
  }

  // ── Uncached reads (delegate) ────────────────────────────────────────────
  findByName(accountId: string, name: string): Promise<Device | null> {
    return this.inner.findByName(accountId, name);
  }

  list(accountId: string): Promise<Device[]> {
    return this.inner.list(accountId);
  }

  listAll(): Promise<Device[]> {
    return this.inner.listAll();
  }

  create(data: CreateDeviceData): Promise<Device> {
    // New id — nothing to invalidate.
    return this.inner.create(data);
  }

  // ── Writes (delegate, then evict) ────────────────────────────────────────
  async updateStatus(
    id: string,
    status: DeviceStatus,
    identifier?: string | null,
  ): Promise<Device> {
    const device = await this.inner.updateStatus(id, status, identifier);
    await invalidateCache(this.cache, this.key(id));
    return device;
  }

  async updateWebhooks(
    accountId: string,
    id: string,
    webhooks: UpdateDeviceWebhooksData,
  ): Promise<Device> {
    const device = await this.inner.updateWebhooks(accountId, id, webhooks);
    await invalidateCache(this.cache, this.key(id));
    return device;
  }

  async delete(accountId: string, id: string): Promise<void> {
    await this.inner.delete(accountId, id);
    await invalidateCache(this.cache, this.key(id));
  }
}
