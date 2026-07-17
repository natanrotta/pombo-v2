import { initAuthCreds, BufferJSON, proto } from "@whiskeysockets/baileys";
import type {
  AuthenticationCreds,
  AuthenticationState,
  SignalDataTypeMap,
} from "@whiskeysockets/baileys";
import { prisma } from "@core/database/prisma/prisma-client";

// The custom AuthenticationState over Prisma. This and session-manager.ts are
// the only places allowed to import Baileys types. Serialization goes through
// BufferJSON so Buffer/Uint8Array survive the round-trip — the make-or-break of
// the whole gateway.
//
// The authState is NOT a token: it is Signal Protocol crypto state that mutates
// every message. Persisting it here is what makes deploy a non-event (no
// re-pair). The `auth_key.value` column is Json — we store the BufferJSON
// string so the exact bytes round-trip.

export interface PrismaAuthState {
  state: AuthenticationState;
  saveCreds: () => Promise<void>;
}

export const makePrismaAuthState = async (
  deviceId: string,
): Promise<PrismaAuthState> => {
  const read = async <T>(key: string): Promise<T | null> => {
    const row = await prisma.auth_key.findUnique({
      where: { device_id_key: { device_id: deviceId, key } },
    });
    return row
      ? (JSON.parse(row.value as string, BufferJSON.reviver) as T)
      : null;
  };

  const write = async (key: string, value: unknown): Promise<void> => {
    const serialized = JSON.stringify(value, BufferJSON.replacer);
    await prisma.auth_key.upsert({
      where: { device_id_key: { device_id: deviceId, key } },
      create: { device_id: deviceId, key, value: serialized },
      update: { value: serialized },
    });
  };

  const remove = async (key: string): Promise<void> => {
    // deleteMany (not delete) so a missing row is a no-op, never a P2025 throw.
    await prisma.auth_key.deleteMany({ where: { device_id: deviceId, key } });
  };

  const creds: AuthenticationCreds =
    (await read<AuthenticationCreds>("creds")) ?? initAuthCreds();

  const keys: AuthenticationState["keys"] = {
    get: async (type: string, ids: string[]) => {
      const result: { [id: string]: SignalDataTypeMap[typeof type] } = {};
      await Promise.all(
        ids.map(async (id: string) => {
          const value = await read<SignalDataTypeMap[typeof type]>(
            `${type}-${id}`,
          );
          if (value === null) return;
          // Only app-state-sync-key needs proto rehydration (matches
          // useMultiFileAuthState). All other types are restored correctly by
          // BufferJSON.reviver; do NOT add proto.fromObject to them or it
          // silently corrupts them.
          result[id] =
            type === "app-state-sync-key"
              ? (proto.Message.AppStateSyncKeyData.fromObject(
                  value,
                ) as unknown as SignalDataTypeMap[typeof type])
              : value;
        }),
      );
      return result;
    },
    set: async (data: Record<string, Record<string, unknown> | undefined>) => {
      const tasks: Promise<void>[] = [];
      for (const type of Object.keys(data) as (keyof SignalDataTypeMap)[]) {
        const category = data[type];
        if (!category) continue;
        for (const id of Object.keys(category)) {
          const value = category[id];
          tasks.push(
            value ? write(`${type}-${id}`, value) : remove(`${type}-${id}`),
          );
        }
      }
      await Promise.all(tasks);
    },
  };

  return {
    state: { creds, keys },
    // Baileys mutates `creds` in place and emits `creds.update`; saveCreds
    // persists the SAME captured reference. The session adapter wires
    //   sock.ev.on('creds.update', saveCreds)
    // — otherwise creds change in memory and never persist (silent re-pair).
    saveCreds: async () => {
      await write("creds", creds);
    },
  };
};
