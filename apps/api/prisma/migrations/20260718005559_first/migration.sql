-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "user_status" AS ENUM ('ACTIVE', 'PENDING');

-- CreateEnum
CREATE TYPE "device_status" AS ENUM ('DISCONNECTED', 'CONNECTING', 'QR_PENDING', 'CONNECTED', 'LOGGED_OUT');

-- CreateEnum
CREATE TYPE "message_status" AS ENUM ('PENDING', 'SERVER_ACK', 'DELIVERY_ACK', 'READ', 'FAILED');

-- CreateEnum
CREATE TYPE "outbox_message_type" AS ENUM ('text', 'image', 'audio', 'video', 'document');

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

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "google_id" TEXT,
    "status" "user_status" NOT NULL DEFAULT 'ACTIVE',
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "avatar_url" TEXT,
    "language" TEXT NOT NULL DEFAULT 'pt-BR',
    "token_version" INTEGER NOT NULL DEFAULT 0,
    "token_expires_at" TIMESTAMP(3),
    "refresh_token_hash" TEXT,
    "refresh_token_expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_token" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_verification_pin" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "pin_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_pin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "identifier" TEXT,
    "status" "device_status" NOT NULL DEFAULT 'DISCONNECTED',
    "webhook_secret" TEXT,
    "webhook_on_connect_url" TEXT,
    "webhook_on_disconnect_url" TEXT,
    "webhook_on_receive_url" TEXT,
    "webhook_on_message_status_url" TEXT,
    "webhook_on_send_url" TEXT,
    "last_connected_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_key" (
    "device_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,

    CONSTRAINT "auth_key_pkey" PRIMARY KEY ("device_id","key")
);

-- CreateTable
CREATE TABLE "outbox_message" (
    "id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "to_jid" TEXT NOT NULL,
    "type" "outbox_message_type" NOT NULL DEFAULT 'text',
    "text" TEXT,
    "payload" JSONB,
    "wa_message_id" TEXT,
    "status" "message_status" NOT NULL DEFAULT 'PENDING',
    "failure_reason" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outbox_message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "api_token_token_hash_key" ON "api_token"("token_hash");

-- CreateIndex
CREATE INDEX "api_token_account_id_idx" ON "api_token"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_google_id_key" ON "user"("google_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_refresh_token_hash_key" ON "user"("refresh_token_hash");

-- CreateIndex
CREATE INDEX "user_account_id_idx" ON "user"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_token_token_hash_key" ON "password_reset_token"("token_hash");

-- CreateIndex
CREATE INDEX "password_reset_token_user_id_idx" ON "password_reset_token"("user_id");

-- CreateIndex
CREATE INDEX "email_verification_pin_user_id_idx" ON "email_verification_pin"("user_id");

-- CreateIndex
CREATE INDEX "device_account_id_idx" ON "device"("account_id");

-- CreateIndex
CREATE INDEX "device_status_idx" ON "device"("status");

-- CreateIndex
CREATE UNIQUE INDEX "device_account_id_name_key" ON "device"("account_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "outbox_message_wa_message_id_key" ON "outbox_message"("wa_message_id");

-- CreateIndex
CREATE INDEX "outbox_message_device_id_idx" ON "outbox_message"("device_id");

-- CreateIndex
CREATE INDEX "outbox_message_expires_at_idx" ON "outbox_message"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "outbox_message_device_id_idempotency_key_key" ON "outbox_message"("device_id", "idempotency_key");

-- AddForeignKey
ALTER TABLE "api_token" ADD CONSTRAINT "api_token_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_token" ADD CONSTRAINT "password_reset_token_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_verification_pin" ADD CONSTRAINT "email_verification_pin_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device" ADD CONSTRAINT "device_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_key" ADD CONSTRAINT "auth_key_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outbox_message" ADD CONSTRAINT "outbox_message_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Polymorphic-column invariant (not modeled in schema.prisma): a `text` message
-- carries `text` and no `payload`; every rich type carries `payload` and no
-- `text`. Structural backstop so a bad write path can't queue a corrupt row.
ALTER TABLE "outbox_message" ADD CONSTRAINT "outbox_message_text_xor_payload_chk" CHECK (
  ("type" = 'text' AND "text" IS NOT NULL AND "payload" IS NULL)
  OR ("type" <> 'text' AND "payload" IS NOT NULL AND "text" IS NULL)
);

