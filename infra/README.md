# infra/ — Deploy skeleton (operational cheat-sheet)

Production infrastructure artifacts. **Single source** (architecture + full runbook + topology):
[`.claude/knowledge/devops.md`](../.claude/knowledge/devops.md). Deploy guide (commands):
[`DEPLOY.md`](../DEPLOY.md) at the root. Day-to-day operations: [`Makefile`](../Makefile) at the root (`make help`).

> This is a **representative skeleton** — adapt the hosts, domains, and provider specifics to your own
> environment before going to production.

> **Golden rule:** the data host never exposes `5432`/`6379` to the internet. App↔DB only through the
> private network / tunnel. **A backup only "exists" after a tested restore-drill.**

```
infra/
  data/docker-compose.data.yml     DATA host: Postgres + Redis + node-exporter
  data/secrets/db_password.txt     (create on the host — NOT committed)
  wireguard/wg0.data.conf.example  tunnel — DATA side (10.8.0.2)
  wireguard/wg0.app.conf.example   tunnel — APP side  (10.8.0.1)
  backup/backup-db.sh              daily encrypted dump → object storage (tier 1)
  backup/backup-promote.sh         GFS retention (weekly/monthly)
  backup/restore-drill.sh          restore rehearsal (quarterly)
  app/docker-compose.prod.yml      APP host: API container (from image registry) + node-exporter
  app/docker-compose.caddy.yml     APP host: Caddy (reverse proxy + TLS)
  app/Caddyfile                    <api-host> → :3333 (origin cert · raw body · SSE)
  .env.prod.example                template for the API production .env
  status.sh                        DATA host status (Postgres/Redis/tunnel/disk/backup)
  status-app.sh                    APP host status (containers/version/tunnel/disk)
```

---

## Day-to-day operations

The normal flow is the **guided commands** (they prompt, follow the run, verify `/api/health`):

```bash
yarn make-tag          # build the version vX.Y (tests + boot-smoke → registry + git tag; nothing builds on push)
yarn deploy            # ship a version (pick among the 3 most recent / latest) and verify
yarn rollback          # revert to a previous version (images stay in the registry, no rebuild)
yarn monitor-status    # health of the services on one screen (API · DB · Web · Site)
```

Advanced infra layer, via `make` (deep SSH, fallback, backup):

```bash
make app-status        # APP host status (containers/image/version/tunnel/disk)
make db-status         # DATA host status (Postgres/Redis/tunnel/disk/backup)
make logs              # tail the API logs
make ssh-app/ssh-data  # SSH into the hosts
make deploy-direct TAG=vX.Y   # fallback: cutover via SSH (no Actions/runner)
```

Quick check without `make`: `curl -s https://<api-host>/healthz` (→ `ok`) ·
`curl -s https://<api-host>/api/health` (→ `{ ok, version, env, uptimeSeconds }`).

---

## Provision from scratch

Condensed runbook in [`.claude/knowledge/devops.md`](../.claude/knowledge/devops.md) › "Provision from scratch"
(Phase A DATA host + backup → Phase B APP host → Phase C static frontends → Phase D validation). Database **first**.

## TLS + edge

Production uses an **origin certificate** at the origin + strict SSL on the edge — the two files live in
`/etc/caddy/certs/origin.{crt,key}` (chmod 600 on the key) and are mounted into the Caddy container.
Alternatives (not used): DNS-01 with the Caddy DNS plugin; a plain Let's Encrypt cert if the origin is public.
> An inbound webhook (`/api/webhooks/*`) needs the **raw body intact** and SSE endpoints need a **proxy without
> buffering** — the `Caddyfile` handles both; on the edge, don't enable body transformations.

## Backup — script variables (`/etc/pombo/backup.env`, on the DATA host)

```sh
AGE_RECIPIENT=age1xxxxxxxx           # PUBLIC age key (the PRIVATE one stays offsite)
RCLONE_REMOTE=r2
RCLONE_BUCKET=pombo-backups
HC_PING_URL=https://hc-ping.com/<uuid>
# optional: PG_CONTAINER, PG_USER, PG_DB, DAILY_RETENTION
```
Crons (`crontab -e`): `30 3 * * *` backup-db.sh · `0 4 * * 0` backup-promote.sh weekly ·
`0 5 1 * *` backup-promote.sh monthly. ⚠️ **Enable and drill this before storing real user data.**

## Monitoring

- Uptime at `https://<api-host>/healthz` · DATA host disk: alarm at 80% · backup: dead-man switch
  (healthchecks.io, when enabled) · errors: your error reporter + `pino` logs.

## Media in S3 (outside the pg_dump scope)

Uploaded files live in the `AWS_S3_BUCKET`, **not** in the database backup. Enable **versioning + lifecycle** on the bucket.

## Operator decisions / secrets

- **Production branch:** `main` (build + deploy workflows).
- **CI/CD:** version `vX.Y` stamped at build time + git tag; one-click deploy with `/api/health` verification.
- **GitHub Actions secrets** (configure per host): the app host SSH target/user/key + a registry read token.
- **PITR (tier 2):** deferred — enable when the data justifies it.
