-- CreateEnum
CREATE TYPE "device_status" AS ENUM ('DISCONNECTED', 'CONNECTING', 'QR_PENDING', 'CONNECTED', 'LOGGED_OUT');

-- CreateEnum
CREATE TYPE "message_status" AS ENUM ('PENDING', 'SERVER_ACK', 'DELIVERY_ACK', 'READ', 'FAILED');

-- CreateTable
CREATE TABLE "device" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "identifier" TEXT,
    "status" "device_status" NOT NULL DEFAULT 'DISCONNECTED',
    "webhook_url" TEXT,
    "webhook_secret" TEXT,
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
    "text" TEXT NOT NULL,
    "wa_message_id" TEXT,
    "status" "message_status" NOT NULL DEFAULT 'PENDING',
    "failure_reason" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outbox_message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "device_name_key" ON "device"("name");

-- CreateIndex
CREATE INDEX "device_status_idx" ON "device"("status");

-- CreateIndex
CREATE UNIQUE INDEX "outbox_message_wa_message_id_key" ON "outbox_message"("wa_message_id");

-- CreateIndex
CREATE INDEX "outbox_message_device_id_idx" ON "outbox_message"("device_id");

-- CreateIndex
CREATE INDEX "outbox_message_expires_at_idx" ON "outbox_message"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "outbox_message_device_id_idempotency_key_key" ON "outbox_message"("device_id", "idempotency_key");

-- AddForeignKey
ALTER TABLE "auth_key" ADD CONSTRAINT "auth_key_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outbox_message" ADD CONSTRAINT "outbox_message_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "device"("id") ON DELETE CASCADE ON UPDATE CASCADE;
