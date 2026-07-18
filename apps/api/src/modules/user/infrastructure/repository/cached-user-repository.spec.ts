import { CachedUserRepository } from "./cached-user-repository";
import { mockUserRepository, mockAppConfig } from "@test/mocks";
import { InMemoryCacheProvider } from "@test/mocks/in-memory-cache.provider";
import { makeUser } from "@modules/user/test/user.factory";

const setup = (cacheOpts: { failing?: boolean } = {}) => {
  const inner = mockUserRepository();
  const cache = new InMemoryCacheProvider(cacheOpts);
  const config = mockAppConfig();
  const sut = new CachedUserRepository(inner, cache, config);
  const user = makeUser({ id: "u1", tokenVersion: 3 });
  inner.findById.mockResolvedValue(user);
  return { inner, cache, sut, user };
};

describe("CachedUserRepository", () => {
  it("findById: caches — the second call is served without touching the inner repo", async () => {
    const { sut, inner, cache, user } = setup();

    const a = await sut.findById("u1");
    expect(a?.id).toBe("u1");
    expect(cache.has("user:u1")).toBe(true);
    expect(inner.findById).toHaveBeenCalledTimes(1);

    const b = await sut.findById("u1");
    expect(b?.tokenVersion).toBe(user.tokenVersion); // rehydrated from cache
    expect(inner.findById).toHaveBeenCalledTimes(1); // no second DB hit
  });

  it("incrementTokenVersion evicts → the revocation is seen on the next request", async () => {
    const { sut, inner, cache } = setup();
    await sut.findById("u1");
    expect(cache.has("user:u1")).toBe(true);

    await sut.incrementTokenVersion("u1");
    expect(cache.has("user:u1")).toBe(false);

    await sut.findById("u1");
    expect(inner.findById).toHaveBeenCalledTimes(2); // reloaded from DB
  });

  it("softDelete evicts the cache", async () => {
    const { sut, cache } = setup();
    await sut.findById("u1");

    await sut.softDelete("u1");

    expect(cache.has("user:u1")).toBe(false);
  });

  it("update evicts the cache", async () => {
    const { sut, inner, cache } = setup();
    inner.update.mockResolvedValue(makeUser({ id: "u1" }));
    await sut.findById("u1");

    await sut.update("u1", { name: "New" });

    expect(cache.has("user:u1")).toBe(false);
  });

  it("does not cache a missing user", async () => {
    const { sut, inner, cache } = setup();
    inner.findById.mockResolvedValue(null);

    const out = await sut.findById("nope");

    expect(out).toBeNull();
    expect(cache.has("user:nope")).toBe(false);
  });

  it("fails open when the cache is down", async () => {
    const { sut } = setup({ failing: true });
    const out = await sut.findById("u1");
    expect(out?.id).toBe("u1");
  });
});
