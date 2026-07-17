#!/usr/bin/env bash
# infra/backup/install-backup.sh — ATIVA o backup Nível 1 na VPS-DATA.
#
# Idempotente. Roda como root NA VPS-DATA (via `make backup-setup` do laptop):
#   1) checa pré-requisitos (docker, age, rclone, curl, systemctl)
#   2) valida /etc/boilerplate/backup.env (copie do backup.env.example e preencha)
#   3) instala os scripts em /opt/boilerplate/
#   4) instala + habilita os systemd timers (backup 2x/dia + promote weekly/monthly)
#
# NÃO gera a chave age nem configura o rclone — isso é setup de SEGREDO, manual
# (ver infra/backup/README.md). Este script só liga a automação.

set -euo pipefail

SRC_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE=/etc/boilerplate/backup.env
BIN_DIR=/opt/boilerplate
UNIT_DIR=/etc/systemd/system

log() { printf '\033[36m[install-backup]\033[0m %s\n' "$*"; }
die() { printf '\033[31m[install-backup] ERRO:\033[0m %s\n' "$*" >&2; exit 1; }

[ "$(id -u)" = 0 ] || die "rode como root (na VPS-DATA)."

# 1) pré-requisitos
log "checando pré-requisitos…"
for bin in docker age rclone curl systemctl; do
  command -v "$bin" >/dev/null 2>&1 || die "falta '$bin' — instale antes (ver README)."
done

# 2) config + segredos já configurados
[ -f "$ENV_FILE" ] || die "$ENV_FILE não existe. Copie infra/backup/backup.env.example → $ENV_FILE, preencha e chmod 600."
# shellcheck disable=SC1090
. "$ENV_FILE"
: "${AGE_RECIPIENT:?defina AGE_RECIPIENT em $ENV_FILE}"
: "${HC_PING_URL:?defina HC_PING_URL em $ENV_FILE}"
: "${RCLONE_REMOTE:=r2}"
: "${RCLONE_BUCKET:=boilerplate-backups}"
# Valida acessando o BUCKET (lsf), não a conta (lsd) — um token R2 escopado por
# bucket (least-privilege) não pode listar a conta e daria 403 no lsd.
rclone lsf "${RCLONE_REMOTE}:${RCLONE_BUCKET}/" >/dev/null 2>&1 \
  || die "remote/bucket rclone '${RCLONE_REMOTE}:${RCLONE_BUCKET}' não responde — rode 'rclone config' (Cloudflare R2) e confira o bucket + 'no_check_bucket = true'."
docker inspect "${PG_CONTAINER:-boilerplate-db}" >/dev/null 2>&1 \
  || die "container '${PG_CONTAINER:-boilerplate-db}' não existe aqui — este script roda na VPS-DATA."
log "config OK (recipient age · remote ${RCLONE_REMOTE}:${RCLONE_BUCKET} · dead-man switch)."

# 3) scripts
log "instalando scripts em $BIN_DIR…"
install -d "$BIN_DIR"
for s in backup-db.sh backup-promote.sh restore-drill.sh backup-check.sh; do
  install -m 0755 "$SRC_DIR/$s" "$BIN_DIR/$s"
done

# 4) systemd units
log "instalando systemd timers…"

cat > "$UNIT_DIR/boilerplate-backup.service" <<'UNIT'
[Unit]
Description=Boilerplate — dump 2x/dia criptografado do Postgres -> R2 (backup Nível 1)
Wants=network-online.target docker.service
After=network-online.target docker.service

[Service]
Type=oneshot
EnvironmentFile=/etc/boilerplate/backup.env
ExecStart=/opt/boilerplate/backup-db.sh
Nice=10
UNIT

cat > "$UNIT_DIR/boilerplate-backup.timer" <<'UNIT'
[Unit]
Description=Boilerplate — agenda o backup do Postgres 2x/dia (03:30 e 15:30)

[Timer]
# Duas execuções por dia apontando para o MESMO boilerplate-backup.service.
OnCalendar=*-*-* 03:30:00
OnCalendar=*-*-* 15:30:00
Persistent=true
RandomizedDelaySec=300

[Install]
WantedBy=timers.target
UNIT

# Promote (GFS) — service templado; %i = weekly|monthly.
cat > "$UNIT_DIR/boilerplate-backup-promote@.service" <<'UNIT'
[Unit]
Description=Boilerplate — promove backup diário -> %i (retenção GFS)
Wants=network-online.target
After=network-online.target

[Service]
Type=oneshot
EnvironmentFile=/etc/boilerplate/backup.env
ExecStart=/opt/boilerplate/backup-promote.sh %i
UNIT

cat > "$UNIT_DIR/boilerplate-backup-promote@weekly.timer" <<'UNIT'
[Unit]
Description=Boilerplate — agenda a promoção semanal (domingo 04:00)

[Timer]
OnCalendar=Sun *-*-* 04:00:00
Persistent=true
Unit=boilerplate-backup-promote@weekly.service

[Install]
WantedBy=timers.target
UNIT

cat > "$UNIT_DIR/boilerplate-backup-promote@monthly.timer" <<'UNIT'
[Unit]
Description=Boilerplate — agenda a promoção mensal (dia 1, 05:00)

[Timer]
OnCalendar=*-*-01 05:00:00
Persistent=true
Unit=boilerplate-backup-promote@monthly.service

[Install]
WantedBy=timers.target
UNIT

systemctl daemon-reload
systemctl enable --now boilerplate-backup.timer
systemctl enable --now boilerplate-backup-promote@weekly.timer
systemctl enable --now boilerplate-backup-promote@monthly.timer

log "timers ativos:"
systemctl list-timers 'boilerplate-backup*' --no-pager || true
echo
log "PRONTO — backup Nível 1 ativo (2x/dia: 03:30 e 15:30 · retenção: ${DAILY_RETENTION_COUNT:-5} dumps mais recentes)."
log "Rode um agora:   systemctl start boilerplate-backup.service && journalctl -u boilerplate-backup.service -n 25 --no-pager"
log "Confira a retenção:  /opt/boilerplate/backup-check.sh"
log "⚠️  Backup só 'existe' depois de um restore-drill testado:  make restore-drill AGE_KEY=<chave privada>"
