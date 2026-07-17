# Activation runbook (one-time) — Deploy + Backup

Operational checklist to make **one-click deploy** and **database backup** fully functional in production.
The artifacts are already in the repo; what's left is the **secret/registration setup** (outside the repo,
done by the operator). Full detail: `.claude/knowledge/devops.md` · backup: `infra/backup/README.md`.

> Recommended order: **A) deploy runner** → **B) database backup**. Both are idempotent (re-running is safe).

---

## A) Deploy — register the self-hosted runner (APP host)

The cutover in `deploy-api.yml` runs on a self-hosted runner on the APP host (no inbound SSH). Without it,
the deploy via Actions fails fast with **"PRODUCTION UNTOUCHED"** and the fallback is `make deploy-direct TAG=…`.

1. **Pre:** `gh auth login` (on your machine) + SSH root on the APP host.
2. **Register (once):**
   ```sh
   make runner-setup
   ```
   This installs the `actions/runner` as a systemd service (user `ghrunner`), registers it with the host
   label, **and grants `ghrunner` read access to `.env.prod`** (group `ghrunner`, `chmod 640`) — the cutover's
   `docker compose` needs to read that `env_file`.
3. **Verify:** runner shows "Idle" in `Settings → Actions → Runners`.
4. **Test deploy:** `yarn deploy` → should end in **✅ confirmed** (then `yarn monitor-status` confirms everything is up).

> ⚠️ **The `.env.prod` grant is LOST if the file is recreated** (a new file inherits `root:root 600`). If you
> recreate `.env.prod`, re-run `make runner-setup` (or `chgrp ghrunner .env.prod && chmod 640 .env.prod`). The
> deploy **pre-flight** detects this and aborts with **PRODUCTION UNTOUCHED** + the fix, before touching the
> container — it never boots a container without env.

> 🔒 **Accepted risk (document it):** `ghrunner` is in the `docker` group (needed for `docker compose`), which
> is equivalent to **root on the APP host** — any job on the runner can read every secret in `.env.prod`, not
> just the ones it needs. The control is keeping the deploy trigger restricted (`workflow_dispatch`, controlled
> repo write access). Future mitigation: rootless Docker or a socket-proxy that limits the runner to
> `pull`/`up`/`logs`.

---

## B) Database backup (DATA host) — dump → object storage, with retention

Logical dump on a schedule → client-side encrypted (`age`) → offsite object storage → keep the most recent
dumps (`daily/`) → dead-man switch. GFS weekly/monthly as the long-term net. Step-by-step and restore commands
in `infra/backup/README.md`.

1. **`age` key** (the PRIVATE one stays OFFSITE, never on the host):
   ```sh
   age-keygen -o backup-age.key    # on YOUR machine; "Public key: age1..." → AGE_RECIPIENT
   ```
   Store `backup-age.key` in a vault (1Password/etc). **Losing it = permanent data loss.**
2. **Object storage:** create the `pombo-backups` bucket + an API token scoped to it with
   **Object Read & Write** → generates an **Access Key ID + Secret Access Key + endpoint**.
   On the DATA host, `rclone config` (or write `/root/.config/rclone/rclone.conf` as **root**):
   type=s3, the access/secret, the endpoint, and **`no_check_bucket = true`**.
   - ⚠️ **`no_check_bucket = true` is required** for a bucket-scoped token — without it rclone tries to
     check/create the bucket and gets a **403**.
   - ✅ Validate with `rclone lsf <remote>:pombo-backups/` (inside the bucket) — **not** `rclone lsd`
     (lists the whole account → 403 on a scoped token).
   - Confirm **egress** from the DATA host to the storage endpoint (if `ufw` is `deny outgoing`, the upload
     fails silently — only the dead-man switch catches it).
3. **Dead-man switch:** create a check at healthchecks.io → copy the ping URL. Set the check period to match
   the schedule + grace.
4. **`/etc/pombo/backup.env`** (on the DATA host): copy from `infra/backup/backup.env.example`, fill in
   `AGE_RECIPIENT` · `HC_PING_URL` · `RCLONE_*` (optional `DAILY_RETENTION_COUNT`), then `chmod 600`.
5. **Activate (from your machine):**
   ```sh
   make backup-setup     # copy the scripts + install/enable the timers
   make backup-now       # run a dump NOW and show the log
   make backup-check     # verify retention
   make backup-status    # scheduled timers + count/latest dumps offsite
   ```
6. **GATE — restore-drill** (a backup never restored is a hypothesis):
   ```sh
   make restore-drill AGE_KEY=/path/backup-age.key
   # downloads the latest dump, decrypts it, and restores into a DISPOSABLE Postgres (does not touch prod)
   ```
   Only consider the backup "active" after the drill passes.

---

## Still pending (outside this runbook — see the backlog in the knowledge doc)

- External uptime monitor — **GATE** before real traffic.
- `ufw` hardening (80/443 only from the edge) · edge access control on internal surfaces · rotate secrets.
- PITR (tier 2, pgBackRest) — enable when the data justifies it · media versioning/lifecycle in S3.
