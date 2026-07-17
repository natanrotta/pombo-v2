import { CachedDevicesRepository } from "./cached-devices.repository";
import { InMemoryDevicesRepository } from "@modules/devices/test/in-memory-devices.repository";
import { InMemoryCacheProvider } from "@test/mocks/in-memory-cache.provider";
import { mockAppConfig } from "@test/mocks";

const ACCOUNT_A = "account-a";
const ACCOUNT_B = "account-b";

const setup = async (cacheOpts: { failing?: boolean } = {}) => {
  const inner = new InMemoryDevicesRepository();
  const cache = new InMemoryCacheProvider(cacheOpts);
  const config = mockAppConfig({ CACHE_ENTITY_TTL_SECONDS: 60 });
  const sut = new CachedDevicesRepository(inner, cache, config);
  const device = await inner.create({
    accountId: ACCOUNT_A,
    name: "phone",
    webhookSecret: "sekret",
  });
  const loadSpy = vi.spyOn(inner, "findByIdInternal");
  return { inner, cache, sut, device, loadSpy };
};

describe("CachedDevicesRepository", () => {
  it("findByIdInternal: miss loads + caches, hit serves without touching the inner repo", async () => {
    const { sut, device, cache, loadSpy } = await setup();

    const first = await sut.findByIdInternal(device.id);
    expect(first?.id).toBe(device.id);
    expect(cache.has(`device:${device.id}`)).toBe(true);
    expect(loadSpy).toHaveBeenCalledTimes(1);

    const second = await sut.findByIdInternal(device.id);
    expect(second?.id).toBe(device.id);
    expect(second?.webhookSecret).toBe("sekret"); // full row round-trips
    expect(loadSpy).toHaveBeenCalledTimes(1); // served from cache
  });

  it("findById: returns the device for the owning account", async () => {
    const { sut, device } = await setup();
    const found = await sut.findById(ACCOUNT_A, device.id);
    expect(found?.id).toBe(device.id);
    expect(found?.accountId).toBe(ACCOUNT_A);
  });

  it("findById: cross-account resolves to null (R1) — no leak even from cache", async () => {
    const { sut, device } = await setup();
    // Prime the cache via the owner, then a foreign account must still get null.
    await sut.findById(ACCOUNT_A, device.id);
    const leaked = await sut.findById(ACCOUNT_B, device.id);
    expect(leaked).toBeNull();
  });

  it("updateStatus evicts the cache — the next read reloads", async () => {
    const { sut, device, loadSpy } = await setup();
    await sut.findByIdInternal(device.id); // cache it (load #1)
    expect(loadSpy).toHaveBeenCalledTimes(1);

    await sut.updateStatus(device.id, "CONNECTED");

    const after = await sut.findByIdInternal(device.id);
    expect(after?.status).toBe("CONNECTED");
    expect(loadSpy).toHaveBeenCalledTimes(2); // reloaded after eviction
  });

  it("updateWebhooks evicts the cache", async () => {
    const { sut, device, cache } = await setup();
    await sut.findByIdInternal(device.id);
    expect(cache.has(`device:${device.id}`)).toBe(true);

    await sut.updateWebhooks(ACCOUNT_A, device.id, {
      onConnect: "https://hook",
    });

    expect(cache.has(`device:${device.id}`)).toBe(false);
    const after = await sut.findById(ACCOUNT_A, device.id);
    expect(after?.webhooks.onConnect).toBe("https://hook");
  });

  it("delete evicts the cache", async () => {
    const { sut, device, cache } = await setup();
    await sut.findByIdInternal(device.id);
    expect(cache.has(`device:${device.id}`)).toBe(true);

    await sut.delete(ACCOUNT_A, device.id);

    expect(cache.has(`device:${device.id}`)).toBe(false);
    expect(await sut.findByIdInternal(device.id)).toBeNull();
  });

  it("fails open when the cache is down — serves from the inner repo", async () => {
    const { sut, device } = await setup({ failing: true });
    const found = await sut.findByIdInternal(device.id);
    expect(found?.id).toBe(device.id);
  });
});
