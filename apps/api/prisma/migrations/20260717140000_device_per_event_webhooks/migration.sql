-- Per-event webhook delivery URLs (PR 2). Replaces the single `webhook_url`
-- with five nullable per-event columns; the single `webhook_secret` that signs
-- every event is unchanged. All additive/nullable, so safe on existing rows;
-- `webhook_url` is dropped (it was opt-in and unused so far).

-- AlterTable
ALTER TABLE "device" DROP COLUMN "webhook_url";
ALTER TABLE "device" ADD COLUMN "webhook_on_connect_url" TEXT;
ALTER TABLE "device" ADD COLUMN "webhook_on_disconnect_url" TEXT;
ALTER TABLE "device" ADD COLUMN "webhook_on_receive_url" TEXT;
ALTER TABLE "device" ADD COLUMN "webhook_on_message_status_url" TEXT;
ALTER TABLE "device" ADD COLUMN "webhook_on_send_url" TEXT;
