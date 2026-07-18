import { BufferJSON } from "@whiskeysockets/baileys";

// This is an infrastructure PROVIDER (a `makePrismaXxx` factory that owns the
// Prisma client directly — no repository sits above it), so mocking the Prisma
// client IS the correct test boundary here.
// Mock it BEFORE importing the SUT. vi.hoisted lets the factory reference these
// fns (they're hoisted above the vi.mock call).
const db = vi.hoisted(() => ({
  findUnique: vi.fn(),
  upsert: vi.fn(),
  deleteMany: vi.fn(),
  $transaction: vi.fn(),
}));

vi.mock("@core/database/prisma/prisma-client", () => ({
  prisma: {
    auth_key: {
      findUnique: db.findUnique,
      upsert: db.upsert,
      deleteMany: db.deleteMany,
    },
    $transaction: db.$transaction,
  },
}));

import { makePrismaAuthState } from "./prisma-auth-state";

type SetArg = Parameters<
  Awaited<ReturnType<typeof makePrismaAuthState>>["state"]["keys"]["set"]
>[0];

describe("makePrismaAuthState", () => {
  beforeEach(() => {
    db.findUnique.mockReset().mockResolvedValue(null);
    db.upsert.mockReset().mockImplementation((arg) => ({ op: "upsert", arg }));
    db.deleteMany.mockReset().mockImplementation((arg) => ({ op: "del", arg }));
    db.$transaction.mockReset().mockResolvedValue([]);
  });

  it("writes the whole key batch in ONE transaction (atomic — no partial state)", async () => {
    const { state } = await makePrismaAuthState("dev-1");

    await state.keys.set({
      "pre-key": { "1": { a: 1 }, "2": { b: 2 } },
    } as unknown as SetArg);

    expect(db.$transaction).toHaveBeenCalledTimes(1);
    const ops = db.$transaction.mock.calls[0]?.[0] as unknown[];
    expect(ops).toHaveLength(2); // both ops committed in one tx
    expect(db.upsert).toHaveBeenCalledTimes(2);
  });

  it("deletes (not upserts) a null key value", async () => {
    const { state } = await makePrismaAuthState("dev-1");

    await state.keys.set({
      session: { x: null },
    } as unknown as SetArg);

    expect(db.deleteMany).toHaveBeenCalledTimes(1);
    expect(db.upsert).not.toHaveBeenCalled();
  });

  it("serves a repeated read of the same key from cache (no second DB hit, same value)", async () => {
    db.findUnique.mockResolvedValue({
      value: JSON.stringify({ n: 7 }, BufferJSON.replacer),
    });
    const { state } = await makePrismaAuthState("dev-1");
    db.findUnique.mockClear(); // isolate from the construction-time creds read

    const got1 = await state.keys.get("pre-key", ["1"]);
    const got2 = await state.keys.get("pre-key", ["1"]);

    expect(db.findUnique).toHaveBeenCalledTimes(1); // 2nd read = cache hit
    // the cached read returns the same value, not an empty short-circuit
    expect(got2).toEqual(got1);
    expect((got2["1"] as { n: number }).n).toBe(7);
  });

  it("gathers a mixed batch (upsert + delete) into a SINGLE transaction", async () => {
    const { state } = await makePrismaAuthState("dev-1");

    await state.keys.set({
      "pre-key": { "1": { a: 1 } },
      session: { "2": null },
    } as unknown as SetArg);

    expect(db.$transaction).toHaveBeenCalledTimes(1);
    const ops = db.$transaction.mock.calls[0]?.[0] as unknown[];
    expect(ops).toHaveLength(2); // the upsert AND the delete, one tx
    expect(db.upsert).toHaveBeenCalledTimes(1);
    expect(db.deleteMany).toHaveBeenCalledTimes(1);
  });

  it("propagates a transaction failure (never a partial write)", async () => {
    db.$transaction.mockRejectedValue(new Error("db down"));
    const { state } = await makePrismaAuthState("dev-1");

    await expect(
      state.keys.set({ "pre-key": { "1": { a: 1 } } } as unknown as SetArg),
    ).rejects.toThrow("db down");
  });

  it("round-trips a Buffer through BufferJSON on a DB read", async () => {
    db.findUnique.mockResolvedValue({
      value: JSON.stringify(
        { blob: Buffer.from([1, 2, 3]) },
        BufferJSON.replacer,
      ),
    });
    const { state } = await makePrismaAuthState("dev-1");

    const got = await state.keys.get("pre-key", ["1"]);
    const blob = (got["1"] as { blob: Buffer }).blob;

    expect(Buffer.isBuffer(blob)).toBe(true);
    expect([...blob]).toEqual([1, 2, 3]);
  });

  it("persists creds through the same atomic upsert path", async () => {
    const { saveCreds } = await makePrismaAuthState("dev-1");
    db.upsert.mockClear();

    await saveCreds();

    expect(db.upsert).toHaveBeenCalledTimes(1);
    const arg = db.upsert.mock.calls[0]?.[0] as {
      where: { device_id_key: { key: string } };
    };
    expect(arg.where.device_id_key.key).toBe("creds");
  });
});
