# Boilerplate — operações de infra de produção a partir da SUA máquina.
#
# A interface do dia a dia são QUATRO comandos guiados (perguntam, acompanham o
# run e verificam /api/health) — NÃO precisa deste Makefile pro fluxo normal:
#
#   yarn make-tag         gera a versão vX.Y (testes + boot-smoke → GHCR + git tag)
#   yarn deploy           sobe uma versão em produção e verifica /api/health
#   yarn rollback         reverte para uma versão anterior (guiado)
#   yarn monitor-status   saúde dos 5 serviços (Backend · Banco · Adm · App · Site)
#
# Este Makefile é a camada AVANÇADA/rara por baixo deles: plano B do deploy (sem
# runner), setup do runner, SSH/logs/status das VPS e backup. Os antigos
# one-liners `make deploy/build/status/version` foram para os comandos yarn acima.
#
# Requisitos:  gh (GitHub CLI autenticado: `gh auth login`) · ssh nas VPS · (opcional) jq
# Guia enxuto: DEPLOY.md · runbook/arquitetura completa: .claude/knowledge/devops.md

# ── Config — SET THESE FOR YOUR OWN INFRASTRUCTURE ────────────────────────────
# The boilerplate ships PLACEHOLDERS on purpose: nothing here points at a real
# host until you set it. Override inline (`make deploy-direct APP_HOST=1.2.3.4
# TAG=v1.5`), export as env vars, or edit the defaults below. The unresolved
# placeholders below intentionally fail (DNS error) instead of touching a host.
TAG       ?= latest
IMAGE     ?=                       # e.g. ghcr.io/you/your-api  (container registry image)
APP_HOST  ?=                       # APP host (API origin) — your host or IP
DATA_HOST ?=                       # DATA host (database) — your host or IP
SSH_USER  ?= root
API_URL   ?=                       # e.g. https://api.your-domain.tld
GH_REPO   ?=                       # e.g. you/your-repo (for the self-hosted runner)
APP_DIR   ?= /opt/boilerplate/app/infra/app

# As linhas acima trazem espaço antes do comentário inline, que entra no valor.
# Sem normalizar, `scp $(SSH_USER)@$(DATA_HOST):/path` vira `root@host :/path`
# (com espaço) e o scp falha; idem `$(IMAGE):$(TAG)` no deploy-direct. Strip resolve.
DATA_HOST := $(strip $(DATA_HOST))
APP_HOST  := $(strip $(APP_HOST))
IMAGE     := $(strip $(IMAGE))

.DEFAULT_GOAL := help

# ── Redirecionamentos (memória muscular → comando guiado) ─────────────────────
# Sem `## ` de propósito: não aparecem no `make help`. Só apontam pro yarn certo.
.PHONY: deploy rollback build status version smoke
deploy rollback build:
	@echo "→ Use o comando guiado:  yarn $@   (o make $@ saiu — o fluxo agora e o yarn)"; exit 1
status version:
	@echo "→ Use:  yarn monitor-status   (substitui make status / make version)"; exit 1
smoke:
	@echo "→ O boot-smoke roda no build (yarn make-tag) e como opcao no yarn deploy."; exit 1

# ── Deploy — plano B (sem runner self-hosted) ─────────────────────────────────
.PHONY: deploy-direct
deploy-direct: ## Plano B sem Actions: cutover DIRETO via SSH da sua máquina (TAG=vX.Y|latest) + verify de fora.
	@echo "🚚 Cutover direto de $(IMAGE):$(TAG) na VPS-APP ($(APP_HOST)) — sem GitHub Actions…"
	ssh $(SSH_USER)@$(APP_HOST) 'set -e; cd $(APP_DIR); export API_IMAGE=$(IMAGE):$(TAG); docker compose -f docker-compose.prod.yml pull api; docker compose -f docker-compose.prod.yml up -d --wait --wait-timeout 300 api; docker image prune -f >/dev/null'
	@echo "→ Verificando de fora ($(API_URL)/api/health)…"; sleep 3; \
	BODY=$$(curl -fsS --max-time 8 $(API_URL)/api/health || true); echo "  $$BODY"; \
	if [ "$(TAG)" = "latest" ]; then echo "$$BODY" | grep -q '"ok":true'; else echo "$$BODY" | grep -q '"version":"$(TAG)"'; fi \
	  && echo "✅ Deploy direto confirmado." \
	  || { echo "❌ /api/health não confirmou ($(TAG)) — veja: make logs"; exit 1; }

.PHONY: runner-setup
runner-setup: ## Instala/registra o runner self-hosted do deploy na VPS-APP (1x; token via gh).
	@echo "🤖 Registrando o runner self-hosted (label boilerplate-app) na VPS-APP…"
	@TOKEN=$$(gh api -X POST repos/$(GH_REPO)/actions/runners/registration-token -q .token) && \
	  ssh $(SSH_USER)@$(APP_HOST) "bash -s -- $$TOKEN" < infra/app/setup-github-runner.sh

# ── Status nas VPS (SSH — visão profunda; o `yarn monitor-status` é a visão rápida) ──
.PHONY: app-status
app-status: ## Status da VPS-APP: containers + imagem/versão + túnel + disco.
	@ssh $(SSH_USER)@$(APP_HOST) 'bash -s' < infra/status-app.sh

.PHONY: db-status
db-status: ## Status da VPS-DATA: Postgres + Redis + túnel + disco + backup.
	@ssh $(SSH_USER)@$(DATA_HOST) 'bash -s' < infra/status.sh

# ── Logs (Ctrl-C p/ sair) ──────────────────────────────────────────────────────
.PHONY: logs
logs: ## Tail dos logs da API (VPS-APP).
	ssh -t $(SSH_USER)@$(APP_HOST) 'cd $(APP_DIR) && docker compose -f docker-compose.prod.yml logs -f --tail=100 api'

.PHONY: logs-caddy
logs-caddy: ## Tail dos logs do Caddy (VPS-APP).
	ssh -t $(SSH_USER)@$(APP_HOST) 'cd $(APP_DIR) && docker compose -f docker-compose.caddy.yml logs -f --tail=100 caddy'

# ── Shells ─────────────────────────────────────────────────────────────────────
.PHONY: ssh-app
ssh-app: ## Abre SSH na VPS-APP.
	ssh $(SSH_USER)@$(APP_HOST)

.PHONY: ssh-data
ssh-data: ## Abre SSH na VPS-DATA.
	ssh $(SSH_USER)@$(DATA_HOST)

# ── Backup (VPS-DATA) ──────────────────────────────────────────────────────────
# Setup de segredos (chave age, rclone R2, healthchecks.io) é manual — ver
# infra/backup/README.md. Estes alvos ligam/operam a automação depois disso.
.PHONY: backup-setup
backup-setup: ## Ativa o backup Nível 1 na VPS-DATA (scripts + systemd timers). Pré: /etc/boilerplate/backup.env preenchido.
	ssh $(SSH_USER)@$(DATA_HOST) 'mkdir -p /opt/boilerplate/backup-src'
	scp infra/backup/*.sh $(SSH_USER)@$(DATA_HOST):/opt/boilerplate/backup-src/
	ssh $(SSH_USER)@$(DATA_HOST) 'bash /opt/boilerplate/backup-src/install-backup.sh'

.PHONY: backup-now
backup-now: ## Roda um backup AGORA na VPS-DATA (2x/dia é o agendado) e mostra o log.
	ssh $(SSH_USER)@$(DATA_HOST) 'systemctl start boilerplate-backup.service && sleep 2 && journalctl -u boilerplate-backup.service -n 25 --no-pager'

.PHONY: backup-status
backup-status: ## Timers (2x/dia) + contagem/últimos dumps no R2 (VPS-DATA).
	ssh $(SSH_USER)@$(DATA_HOST) 'systemctl list-timers "boilerplate-backup*" --no-pager; echo; . /etc/boilerplate/backup.env 2>/dev/null && { echo "dumps em daily/: $$(rclone lsf "$${RCLONE_REMOTE:-r2}:$${RCLONE_BUCKET:-boilerplate-backups}/daily/" --files-only 2>/dev/null | grep -c .) (teto $${DAILY_RETENTION_COUNT:-5})"; rclone lsl "$${RCLONE_REMOTE:-r2}:$${RCLONE_BUCKET:-boilerplate-backups}/daily/" 2>/dev/null | tail -5; } || echo "(rclone/remote indisponível)"'

.PHONY: backup-check
backup-check: ## Confere a invariante de retenção no R2 (0<count<=5). Sai != 0 em erro.
	ssh $(SSH_USER)@$(DATA_HOST) '. /etc/boilerplate/backup.env 2>/dev/null; /opt/boilerplate/backup-check.sh'

.PHONY: restore-drill
restore-drill: ## Ensaio de restauração LOCAL (não toca prod). Uso: make restore-drill AGE_KEY=/caminho/backup-age.key
	@[ -n "$(AGE_KEY)" ] || { echo "Informe a chave PRIVADA age: make restore-drill AGE_KEY=/caminho/backup-age.key"; exit 1; }
	AGE_KEY_FILE="$(AGE_KEY)" bash infra/backup/restore-drill.sh

# ── Help ───────────────────────────────────────────────────────────────────────
.PHONY: help
help: ## Lista os alvos disponíveis.
	@echo "Boilerplate — infra de produção (camada avançada). O fluxo normal é o yarn:"; \
	 echo "  yarn make-tag · yarn deploy · yarn rollback · yarn monitor-status"; echo
	@echo "Alvos deste Makefile (SSH/backup/plano-B):"
	@grep -hE '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
	  | awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'
