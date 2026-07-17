-- Multi-tenancy foundation (PR 1). Introduces `account` as the tenant root and
-- `api_token` (public-API credential), then backfills `account_id` onto the
-- existing `user` and `device` rows BEFORE enforcing NOT NULL — so the change
-- is safe against a non-empty database (additive → backfill → constrain).

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_token" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "token_prefix" TEXT NOT NULL,
    "created_by_user_id" TEXT NOT NULL,
    "last_used_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_token_pkey" PRIMARY KEY ("id")
);

-- AlterTable — add nullable first, backfill below, then SET NOT NULL.
ALTER TABLE "user" ADD COLUMN "account_id" TEXT;
ALTER TABLE "device" ADD COLUMN "account_id" TEXT;

-- Backfill: one account per existing user (account.name = user.name). MVP is a
-- 1:1 user↔account mapping; the model already supports many users per account.
DO $$
DECLARE
  r RECORD;
  new_account_id TEXT;
BEGIN
  FOR r IN SELECT "id", "name" FROM "user" LOOP
    new_account_id := gen_random_uuid()::text;
    INSERT INTO "account" ("id", "name", "created_at", "updated_at")
      VALUES (new_account_id, r."name", now(), now());
    UPDATE "user" SET "account_id" = new_account_id WHERE "id" = r."id";
  END LOOP;
END $$;

-- Backfill: pre-tenancy devices were single-operator (no owner). Attach them to
-- the oldest user's account; if there are no users at all, park them in a
-- dedicated "Legacy devices" account so NOT NULL below never fails.
DO $$
DECLARE
  fallback_account_id TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM "device" WHERE "account_id" IS NULL) THEN
    SELECT u."account_id" INTO fallback_account_id
      FROM "user" u ORDER BY u."created_at" ASC LIMIT 1;
    IF fallback_account_id IS NULL THEN
      fallback_account_id := gen_random_uuid()::text;
      INSERT INTO "account" ("id", "name", "created_at", "updated_at")
        VALUES (fallback_account_id, 'Legacy devices', now(), now());
    END IF;
    UPDATE "device" SET "account_id" = fallback_account_id WHERE "account_id" IS NULL;
  END IF;
END $$;

-- Every row is backfilled — enforce the invariant.
ALTER TABLE "user" ALTER COLUMN "account_id" SET NOT NULL;
ALTER TABLE "device" ALTER COLUMN "account_id" SET NOT NULL;

-- Device names are unique PER ACCOUNT now, not globally.
DROP INDEX "device_name_key";

-- CreateIndex
CREATE INDEX "user_account_id_idx" ON "user"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "api_token_token_hash_key" ON "api_token"("token_hash");

-- CreateIndex
CREATE INDEX "api_token_account_id_idx" ON "api_token"("account_id");

-- CreateIndex
CREATE INDEX "device_account_id_idx" ON "device"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "device_account_id_name_key" ON "device"("account_id", "name");

-- AddForeignKey
ALTER TABLE "api_token" ADD CONSTRAINT "api_token_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device" ADD CONSTRAINT "device_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
