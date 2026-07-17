#!/usr/bin/env bash
#
# drop:all — derruba TODOS os containers Docker ativos na máquina e limpa
# as redes órfãs. Usado quando `yarn start` / `yarn services:up` falha com
# "failed to set up container networking: network <id> not found" — sintoma
# de uma rede referenciada por ID que não existe mais no daemon.
#
# Uso: yarn drop:all
#
set -euo pipefail

if ! docker info >/dev/null 2>&1; then
  echo "❌ Docker não está rodando. Abra o Docker Desktop e tente de novo."
  exit 1
fi

running="$(docker ps -q)"
if [ -n "$running" ]; then
  echo "⏹  Parando containers ativos..."
  # shellcheck disable=SC2086
  docker stop $running >/dev/null
else
  echo "✓ Nenhum container ativo."
fi

all="$(docker ps -aq)"
if [ -n "$all" ]; then
  echo "🗑  Removendo containers..."
  # shellcheck disable=SC2086
  docker rm -f $all >/dev/null
fi

echo "🧹 Limpando redes órfãs..."
docker network prune -f >/dev/null

echo "✅ Docker limpo. Rode 'yarn start' novamente."
