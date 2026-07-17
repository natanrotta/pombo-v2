#!/usr/bin/env bash
# infra/backup/restore-drill.sh — ENSAIO DE RESTAURAÇÃO (trimestral).
#
# "Backup nunca restaurado é hipótese, não backup." Baixa o dump mais recente
# do R2, descriptografa com a chave PRIVADA age e restaura num container
# Postgres DESCARTÁVEL. NUNCA toca o banco de produção.
#
# A chave privada age vive OFFSITE — traga-a só para o drill e remova depois.
#
# Uso:
#   AGE_KEY_FILE=/caminho/seguro/backup-age.key /opt/pombo/restore-drill.sh

set -euo pipefail

: "${RCLONE_REMOTE:=r2}"
: "${RCLONE_BUCKET:=pombo-backups}"
: "${AGE_KEY_FILE:?defina AGE_KEY_FILE (chave PRIVADA age — offsite, traga so p/ o drill)}"
: "${TEST_CONTAINER:=pombo-db-test}"
: "${PG_USER:=pombo}"
: "${TIER:=daily}"
: "${TMP_DIR:=/tmp}"

LATEST="$(rclone lsf "${RCLONE_REMOTE}:${RCLONE_BUCKET}/${TIER}/" --files-only | sort | tail -1)"
[ -n "${LATEST}" ] || { echo "nenhum backup em ${TIER}/"; exit 1; }
echo "[restore-drill] usando ${TIER}/${LATEST}"

rclone copyto "${RCLONE_REMOTE}:${RCLONE_BUCKET}/${TIER}/${LATEST}" "${TMP_DIR}/${LATEST}"

# Sobe um Postgres descartável só para o teste (--rm: some ao parar).
docker run -d --rm --name "${TEST_CONTAINER}" \
  -e POSTGRES_USER="${PG_USER}" \
  -e POSTGRES_PASSWORD=drill \
  -e POSTGRES_DB=pombo_restore \
  postgres:15-alpine >/dev/null

echo "[restore-drill] aguardando Postgres de teste subir..."
until docker exec "${TEST_CONTAINER}" pg_isready -U "${PG_USER}" >/dev/null 2>&1; do sleep 1; done

# Descriptografa (chave privada) + restaura no container de teste.
age -d -i "${AGE_KEY_FILE}" "${TMP_DIR}/${LATEST}" | \
  docker exec -i "${TEST_CONTAINER}" \
    pg_restore -U "${PG_USER}" -d pombo_restore --clean --if-exists --no-owner

rm -f "${TMP_DIR}/${LATEST}"

echo "[restore-drill] OK — restaurado em ${TEST_CONTAINER}:pombo_restore"
echo "[restore-drill] valide:   docker exec ${TEST_CONTAINER} psql -U ${PG_USER} -d pombo_restore -c '\\dt'"
echo "[restore-drill] finalize: docker stop ${TEST_CONTAINER}"
