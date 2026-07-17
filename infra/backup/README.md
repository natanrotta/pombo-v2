# Backup do Postgres (VPS-DATA) — Nível 1

Dump lógico **2x/dia (03:30 e 15:30)** → criptografado client-side (`age`) →
offsite (Cloudflare R2) → dead-man switch (healthchecks.io). Retenção do tier
`daily/`: **count-based — os 5 dumps mais recentes** (`DAILY_RETENTION_COUNT`,
default 5; ~2,5 dias a 2x/dia). GFS **weekly/monthly** (4 · 12) seguem como rede
de longo prazo, em prefixos separados — não contam no limite dos 5.

> **"Backup nunca restaurado é hipótese, não backup."** Só conta depois de um
> `restore-drill` testado. Ligar isto é a TRAVA antes do 1º dado de paciente real.

## Peças

| Arquivo | O quê |
|---|---|
| `backup-db.sh` | dump 2x/dia → `age` → R2 → poda daily/ (mantém 5) + ping no dead-man switch |
| `backup-promote.sh` | promove diário → weekly/monthly (GFS) |
| `backup-check.sh` | confere a invariante de retenção (0 < count ≤ 5) — read-only, sai != 0 em erro |
| `restore-drill.sh` | restaura o último dump num container descartável (**não toca prod**) |
| `install-backup.sh` | ativa tudo na VPS-DATA (scripts + systemd timers 2x/dia + GFS) |
| `backup.env.example` | template de `/etc/pombo/backup.env` |

## Setup (uma vez) — segredos, manual

### 1. Chave `age` (a PRIVADA fica OFFSITE)
```sh
age-keygen -o backup-age.key      # NA SUA máquina, NÃO na VPS
# "Public key: age1..."  → AGE_RECIPIENT no backup.env
# backup-age.key (PRIVADA) → cofre/1Password OFFSITE. NUNCA na VPS-DATA.
```

### 2. Cloudflare R2 + rclone (na VPS-DATA)
Crie o bucket `pombo-backups` no R2 + um API token (R2 read/write). Na VPS-DATA:
```sh
rclone config     # n) new · name: r2 · type: s3 · provider: Cloudflare
                  # + access_key/secret + endpoint https://<accountid>.r2.cloudflarestorage.com
rclone lsd r2:    # deve listar o bucket
```

### 3. Dead-man switch
Crie um check em healthchecks.io com **período ~12h** (roda 2x/dia) + folga
(grace ≥ ~15min, cobre o `RandomizedDelaySec`) → copie a **ping URL**.

### 4. `/etc/pombo/backup.env` (na VPS-DATA)
```sh
scp infra/backup/backup.env.example root@<VPS-DATA>:/etc/pombo/backup.env
# edite: AGE_RECIPIENT · HC_PING_URL · RCLONE_* ; depois: chmod 600 /etc/pombo/backup.env
```

## Ativar (do seu laptop)
```sh
make backup-setup     # copia os scripts + instala/habilita os systemd timers (2x/dia + GFS)
make backup-now       # roda um backup AGORA e mostra o log
make backup-check     # confere a retenção: 0 < count <= 5 (sai != 0 em erro)
make backup-status    # timers agendados + contagem/últimos dumps no R2
```

## Restore-drill (trimestral — OBRIGATÓRIO)
Roda **LOCAL** (nunca toca prod). Precisa `docker` + `rclone` (remote `r2`) + `age` + a chave **privada**:
```sh
make restore-drill AGE_KEY=/caminho/backup-age.key
# baixa o último dump, descriptografa e restaura num Postgres descartável;
# valide:  docker exec pombo-db-test psql -U pombo -d pombo_restore -c '\dt'
```

## Restaurar em desastre (prod real)
1. Postgres limpo (ou reset do `pombo-db`).
2. `rclone copyto r2:pombo-backups/daily/<X>.dump.age /tmp/x.age`
3. `age -d -i backup-age.key /tmp/x.age > /tmp/x.dump`  (chave privada, trazida do cofre)
4. `cat /tmp/x.dump | docker exec -i pombo-db pg_restore -U pombo -d pombo --clean --if-exists --no-owner`
5. Suba a API e confira `/api/health` + admin → system-status.

## Fora do escopo (não esquecer)
- **Mídia (áudio/PDF) vive no S3**, não no `pg_dump` → ligar **versioning + lifecycle** no bucket.
- **PITR (Nível 2, WAL)**: adiado até o 1º paciente real (pgBackRest).
