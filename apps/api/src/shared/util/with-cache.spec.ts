import { withCache, invalidateCache, type CacheCodec } from "./with-cache";
import { InMemoryCacheProvider } from "@test/mocks/in-memory-cache.provider";

interface Thing {
  id: string;
  when: Date;
}

const codec: CacheCodec<Thing> = {
  serialize: (t) => ({ id: t.id, when: t.when.toISOString() }),
  deserialize: (raw) => {
    const r = raw as { id: string; when: string };
    return { id: r.id, when: new Date(r.when) };
  },
};

const thing: Thing = { id: "t1", when: new Date("2026-01-01T00:00:00.000Z") };

describe("withCache", () => {
  it("miss → runs the loader, back-fills the cache, returns the value", async () => {
    const cache = new InMemoryCacheProvider();
    const loader = vi.fn().mockResolvedValue(thing);

    const out = await withCache(cache, "k", 60, loader, codec);

    expect(out).toEqual(thing);
    expect(loader).toHaveBeenCalledTimes(1);
    expect(cache.has("k")).toBe(true);
  });

  it("hit → deserializes from cache without calling the loader", async () => {
    const cache = new InMemoryCacheProvider();
    const loader = vi.fn().mockResolvedValue(thing);
    await withCache(cache, "k", 60, loader, codec); // seed

    const second = vi.fn().mockResolvedValue(thing);
    const out = await withCache(cache, "k", 60, second, codec);

    expect(out).toEqual(thing);
    expect(out?.when).toBeInstanceOf(Date); // rehydrated, not a string
    expect(second).not.toHaveBeenCalled();
  });

  it("does NOT cache a null result (so a later create is not masked)", async () => {
    const cache = new InMemoryCacheProvider();

    const out = await withCache(cache, "k", 60, async () => null, codec);

    expect(out).toBeNull();
    expect(cache.has("k")).toBe(false);
  });

  it("fails open when the cache throws — degrades to the loader", async () => {
    const cache = new InMemoryCacheProvider({ failing: true });
    const loader = vi.fn().mockResolvedValue(thing);

    const out = await withCache(cache, "k", 60, loader, codec);

    expect(out).toEqual(thing);
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("treats a corrupt/undeserializable entry as a miss and reloads", async () => {
    const cache = new InMemoryCacheProvider();
    // Poke a value the codec can't deserialize into the store.
    await cache.set("k", JSON.stringify({ garbage: true }), 60);
    const badCodec: CacheCodec<Thing> = {
      serialize: codec.serialize,
      deserialize: () => {
        throw new Error("shape drift");
      },
    };
    const loader = vi.fn().mockResolvedValue(thing);

    const out = await withCache(cache, "k", 60, loader, badCodec);

    expect(out).toEqual(thing);
    expect(loader).toHaveBeenCalledTimes(1);
  });
});

describe("invalidateCache", () => {
  it("deletes the key", async () => {
    const cache = new InMemoryCacheProvider();
    await cache.set("k", JSON.stringify({ a: 1 }), 60);

    await invalidateCache(cache, "k");

    expect(cache.has("k")).toBe(false);
  });

  it("fails open when the delete throws", async () => {
    const cache = new InMemoryCacheProvider({ failing: true });
    await expect(invalidateCache(cache, "k")).resolves.toBeUndefined();
  });
});
