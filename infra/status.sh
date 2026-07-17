#!/usr/bin/env bash
# infra/status.sh — snapshot de saúde da VPS-DATA (Postgres + Redis + túnel + disco + backup).
#
# Responde "está tudo ok?" numa tela só. Read-only: não altera nada.
# Uso na VPS-DATA:  bash /opt/boilerplate/repo/infra/status.sh
# Atalho opcional:  ln -s /opt/boilerplate/repo/infra/status.sh /usr/local/bin/boilerplate-status
#
# Sobrescreva os defaults via env se mudar os caminhos/nomes.
set -uo pipefail

DATA_DIR="${DATA_DIR:-/opt/boilerplate/repo/infra/data}"
PG_CONTAINER="${PG_CONTAINER:-boilerplate-db}"
REDIS_CONTAINER="${REDIS_CONTAINER:-boilerplate-redis}"
PG_USER="${PG_USER:-boilerplate}"
PG_DB="${PG_DB:-boilerplate}"

c_ok()  { printf '  \033[32m✓\033[0m %s\n' "$1"; }
c_no()  { printf '  \033[31m✗\033[0m %s\n' "$1"; }
c_wn()  { printf '  \033[33m!\033[0m %s\n' "$1"; }
psqlq() { docker exec "$PG_CONTAINER" psql -U "$PG_USER" -d "$PG_DB" -tAc "$1" 2>/dev/null; }

echo "================ BOILERPLATE · STATUS · $(date '+%F %T %Z') ================"

echo; echo "## Containers"
docker ps --filter "name=boilerplate-" --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' 2>/dev/null \
  || c_no "docker indisponível"

echo; echo "## Postgres"
if docker exec "$PG_CONTAINER" pg_isready -U "$PG_USER" -d "$PG_DB" >/dev/null 2>&1; then
  c_ok "aceitando conexões (pg_isready)"
  VER=$(psqlq "show server_version;")
  [ -n "$VER" ] && c_ok "Postgres $VER"
  # _prisma_migrations só existe depois que a API rodou o migrate (Fase B)
  if [ "$(psqlq "select to_regclass('public._prisma_migrations') is not null;")" = "t" ]; then
    APPLIED=$(psqlq "select count(*) from _prisma_migrations where finished_at is not null;")
    PENDING=$(psqlq "select count(*) from _prisma_migrations where finished_at is null;")
    LAST=$(psqlq "select migration_name from _prisma_migrations where finished_at is not null order by finished_at desc limit 1;")
    c_ok "migrations aplicadas: ${APPLIED:-0} (última: ${LAST:-—})"
    [ "${PENDING:-0}" != "0" ] && c_no "migrations incompletas/falhas: $PENDING" || true
  else
    c_wn "sem _prisma_migrations — a API ainda não rodou migrate (esperado até a Fase B)"
  fi
  TBLS=$(psqlq "select count(*) from information_schema.tables where table_schema='public';")
  c_ok "tabelas no schema public: ${TBLS:-0}"
else
  c_no "Postgres NÃO responde (pg_isready falhou)"
fi

echo; echo "## Redis"
if [ -f "$DATA_DIR/.env" ]; then
  RP=$(sed -n 's/^REDIS_PASSWORD=//p' "$DATA_DIR/.env")
  PONG=$(docker exec "$REDIS_CONTAINER" redis-cli -a "$RP" ping 2>/dev/null | tr -d '\r')
  [ "$PONG" = "PONG" ] && c_ok "ping: PONG" || c_no "ping falhou (resposta: ${PONG:-vazio})"
  RVER=$(docker exec "$REDIS_CONTAINER" redis-cli -a "$RP" info server 2>/dev/null | sed -n 's/^redis_version://p' | tr -d '\r')
  AOF=$(docker exec "$REDIS_CONTAINER" redis-cli -a "$RP" config get appendonly 2>/dev/null | tail -1 | tr -d '\r')
  [ -n "$RVER" ] && c_ok "Redis $RVER (AOF: ${AOF:-?})"
else
  c_wn "$DATA_DIR/.env não encontrado — pulei o Redis"
fi

echo; echo "## Túnel WireGuard"
if ip link show wg0 >/dev/null 2>&1; then
  ADDR=$(ip -4 -o addr show wg0 | awk '{print $4}')
  c_ok "wg0 UP — $ADDR"
  PEERS=$(wg show wg0 peers 2>/dev/null)
  if [ -z "$PEERS" ]; then
    c_wn "nenhum peer (a VPS-APP entra na Fase B)"
  else
    while read -r pk; do
      [ -z "$pk" ] && continue
      HS=$(wg show wg0 latest-handshakes 2>/dev/null | awk -v k="$pk" '$1==k{print $2}')
      if [ "${HS:-0}" -gt 0 ] 2>/dev/null; then
        AGO=$(( $(date +%s) - HS ))
        c_ok "peer ${pk:0:12}… handshake há ${AGO}s"
      else
        c_wn "peer ${pk:0:12}… sem handshake ainda"
      fi
    done <<< "$PEERS"
  fi
else
  c_no "wg0 AUSENTE — túnel não está no ar"
fi

echo; echo "## Disco"
df -h / | awk 'NR==1 || /\/$/{print "  "$0}'
USEP=$(df --output=pcent / | tail -1 | tr -dc '0-9')
if [ "${USEP:-0}" -ge 80 ]; then c_no "disco em ${USEP}% (acima de 80%!)"; else c_ok "disco em ${USEP}%"; fi

echo; echo "## Backup (Nível 1)"
if systemctl list-timers 'boilerplate-backup*' >/dev/null 2>&1; then
  systemctl list-timers 'boilerplate-backup*' --no-pager 2>/dev/null | sed 's/^/  /' | head -4
fi
# Contagem de dumps em daily/ vs o teto de retenção (count-based, default 5).
if command -v rclone >/dev/null 2>&1 && [ -f /etc/boilerplate/backup.env ]; then
  # shellcheck disable=SC1091
  . /etc/boilerplate/backup.env 2>/dev/null || true
  N=$(rclone lsf "${RCLONE_REMOTE:-r2}:${RCLONE_BUCKET:-boilerplate-backups}/daily/" --files-only 2>/dev/null | grep -c . || echo 0)
  KEEP="${DAILY_RETENTION_COUNT:-5}"
  if [ "${N:-0}" -eq 0 ]; then
    c_wn "nenhum dump em daily/ ainda (backup rodou? ver dead-man switch)"
  elif [ "${N}" -gt "${KEEP}" ]; then
    c_no "dumps em daily/: ${N} (acima do teto ${KEEP} — poda falhou)"
  else
    c_ok "dumps em daily/: ${N}/${KEEP} (2x/dia)"
  fi
else
  c_wn "rclone/backup.env indisponível — pulei a contagem de dumps"
fi
if [ -f /var/log/boilerplate-backup.log ]; then
  tail -2 /var/log/boilerplate-backup.log | sed 's/^/  /'
else
  c_wn "sem log ainda — backup é configurado no passo A5"
fi

echo; echo "========================================================================"
