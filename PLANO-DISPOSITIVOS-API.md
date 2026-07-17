# Plano — Dispositivos, Webhooks por Evento e API Pública (v1)

| Campo | Valor |
|---|---|
| **Status** | draft — aguardando aprovação |
| **Branch** | `feature/devices-api-integration-plan` |
| **Data** | 2026-07-17 |
| **Tamanho / Risco** | L / **Alto** (migração de tenancy + nova superfície de auth) |
| **Especialistas de execução** | `/backend`, `/frontend`, `/test`, `/test-e2e` |
| **Escopo desta branch** | Somente este documento. A implementação acontece em branches/PRs próprios (ver § 11). |

---

## 1. Resumo executivo

Unir o backend (gateway WhatsApp já funcional via Baileys) com o frontend (shell pronto, sem telas de dispositivos) para que o usuário consiga, pela interface:

1. Criar uma instância/dispositivo e conectá-la lendo um **QR Code**;
2. Listar todos os dispositivos com status;
3. Cadastrar **5 URLs de webhook por dispositivo** (ao conectar, ao desconectar, ao receber, status da mensagem, ao enviar);
4. Gerar um **API Token** nas configurações da conta (gerar novo revoga o antigo);

E para que consumidores externos usem a **API pública `/api/v1`** (autenticada pelo API Token) para **listar dispositivos** e **enviar mensagem de texto**.

Estruturalmente, isso exige introduzir a entidade **`account`** (multi-tenancy): uma conta tem vários usuários, e toda tabela que precisa de vínculo passa a se ligar por `account_id`.

### O que já existe (reuso ≥ 60%)

O backend do pombo **já implementa** o núcleo: registro/conexão de devices com lifecycle Baileys, envio de texto com outbox + idempotência, status monotônico de mensagem e dispatch de webhooks com HMAC + retry. O frontend **já tem** todos os blocos de UI (`ListPageLayout`, `EntityCard`, `StatCard`, `AppTabs`, `FormField`, `useDetailPageController`...) e a lib `qrcode` no `package.json`. O trabalho é majoritariamente **ligação e escopo**, não construção do zero.

---

## 2. Decisions log

Decisões tomadas com o usuário em 2026-07-17 (rodada batched do `/architect`):

| # | Tópico | Decisão |
|---|---|---|
| 1 | Tenancy | **Nova entidade `account`**. Uma account tem N usuários (`user.account_id`). Tabelas "com dono" vinculam por `account_id`. |
| 2 | API pública | Prefixo **`/api/v1/*` separado**, com middleware próprio de API token. Rotas internas do frontend continuam JWT-only. |
| 3 | Entrega do QR | **Polling**: `GET /devices/:id/qr` retorna QR atual + status; frontend refaz a cada ~3s enquanto o modal está aberto. |
| 4 | Fluxo de criação | **Modal (só nome) → página de detalhe** `/devices/:id` com status, conexão/QR e seção de webhooks. |
| 5 | Armazenamento webhooks | **5 colunas nullable** no `device` + **um único `webhook_secret`** assinando todos os eventos. Coluna antiga `webhook_url` é removida. |
| 6 | Evento "ao enviar" | Novo webhook **`message.sent`**, payload **sem o conteúdo do texto** (só `messageId` + `phone`). |
| 7 | Envio público | `POST /api/v1/devices/:deviceId/send-text` com `{ phone, message }`; **`Idempotency-Key` opcional** (gerado se ausente). |
| 8 | Formato do token | **`pmb_` + 40 hex**, armazenado como SHA-256, exibido **uma única vez**; UI mostra prefixo + últimos 4 + criação + último uso. Gerar novo revoga o anterior. |
| 9 | Rate limit | Limiter **dedicado por token** na API pública (além do global). |
| 10 | UI da listagem | 3 `StatCard` (total/conectadas/desconectadas) + **grid de cards**; vista tabela fora do MVP. |
| 11 | Envio no frontend | **Não há UI de envio de mensagem** — envio é exclusivo da API pública. |
| 12 | Escopo do token | **Por account** (um token ativo por conta; qualquer usuário da conta gera/revoga). |
| 13 | MVP de accounts | Signup **cria a account automaticamente** (1:1 no MVP). Sem UI de convites/membros/roles nesta versão. |

---

## 3. Análise

- **Problema:** o gateway funciona, mas só é operável por terminal/API interna — não há como um usuário criar e conectar um dispositivo, configurar webhooks ou obter credencial de integração sem acesso ao código.
- **Usuário-alvo:** dono da conta (operador) que conecta números de WhatsApp e integra sistemas externos via API + webhooks.
- **Valor:** transforma o pombo de "motor" em **produto self-service** (modelo Z-API): onboarding completo pela UI + integração externa por token.
- **Métricas de sucesso:** usuário cria device, escaneia QR e vê status `CONNECTED` sem tocar no terminal; consumidor externo envia texto com o token e recebe os webhooks configurados.
- **Impacto no existente:** `auth` (signup cria account), `user` (FK account), `devices` (escopo + QR + webhooks), `messaging` (evento `message.sent`), `webhooks` (roteamento por evento), novo módulo `account`, nova superfície `public-api`. Frontend: novo módulo `devices`, nova tab em `settings`, sidebar.
- **Riscos:** migração de tenancy em tabelas existentes; nova superfície de autenticação (token); QR com janela de expiração (~30s por código).
- **MVP:** itens do § 1. **Fora do MVP (evoluções futuras):** pipeline de recebimento de mensagens (webhook "ao receber" fica dormente), convites/membros/roles de account, vista tabela na listagem, `GET /api/v1/messages/:id` (status por polling público), métricas reais no Dashboard, múltiplos tokens por conta com escopos.

---

## 4. Comportamentos fixos (hardcoded — sem UI, sem colunas)

Nesta versão **apenas enviamos** mensagens. O motor não processa nada recebido, portanto as "configurações ao receber" do Z-API viram **comportamento fixo documentado**, não configuração:

| Comportamento | Valor fixo |
|---|---|
| Ignorar mensagens de grupos / texto / vídeo / documento / imagem / áudio / chats privados | `true` (nada é processado) |
| Rejeitar chamadas automaticamente | não faz |
| Ler mensagens automaticamente | não faz |
| Ler status automaticamente | não faz |
| Processar histórico após conexão | não faz |

Consequência direta: a URL "ao receber" (`webhook_on_receive_url`) é **cadastrada e persistida, mas nunca disparada** nesta versão. Quando o pipeline de recebimento existir, a configuração já estará no lugar. Isso deve estar explícito na UI (helper text do campo).

---

## 5. Domínio

### 5.1 Reuso (o que já existe e como aproveitar)

| Recurso | Caminho | Como reusar |
|---|---|---|
| Lifecycle de device (Baileys) | `apps/api/src/modules/devices/infrastructure/provider/session-manager.ts` | Já emite `session.qr` no bus — falta só cachear o último QR por device para o endpoint de polling |
| Envio de texto + outbox + idempotência | `apps/api/src/modules/messaging/application/use-case/messages/send-text-message.use-case.ts` | Chamado pelo controller público `/v1` sem duplicação |
| Dispatch de webhook (HMAC + retry) | `apps/api/src/modules/webhooks/infrastructure/provider/http-webhook-sender.ts` | Intacto; muda só a **resolução da URL** (por evento) no dispatch use case |
| Revogação por versão de token | `user.token_version` + `authMiddleware` | Padrão de referência para o design do api_token (hash + revogação) |
| UI de listagem/detalhe/forms/tabs | `apps/web/src/shared/components/**`, `shared/hooks/**` | Telas novas são composição de `ListPageLayout`, `EntityCard`, `StatCard`, `SectionCard`, `AppTabs`, `FormField`, `AppModal`, `ConfirmDialog`, `useListPageController`, `useDetailPageController` |
| Lib `qrcode` (v1.5.4) | `apps/web/package.json` | Já instalada, não usada — renderiza o QR string em canvas/dataURL |

### 5.2 Novas entidades

| Entidade | Campos | Relações | Por que não reusar existente |
|---|---|---|---|
| `account` | `id`, `name`, `created_at`, `updated_at`, `deleted_at` | 1:N `user`, 1:N `device`, 1:N `api_token` | Não existe conceito de conta; `user` não serve porque uma conta terá N usuários (decisão #1) |
| `api_token` | `id`, `account_id`, `token_hash` (SHA-256, unique), `token_prefix` (ex.: `pmb_a1b2…9f3c`, para exibição), `created_by_user_id`, `last_used_at?`, `revoked_at?`, `created_at` | N:1 `account` | Não pode ser coluna em `user` (token é da conta, decisão #12) nem reusar JWT (vida longa, revogação independente do login) |

Invariante: **no máximo 1 registro ativo (`revoked_at = null`) por account** — a geração de um novo token revoga o anterior na mesma transação.

### 5.3 Entidades modificadas

| Entidade | Mudança | Motivo |
|---|---|---|
| `user` | + `account_id` (FK obrigatória) | Decisão #1 |
| `device` | + `account_id` (FK obrigatória); `@@unique([account_id, name])` no lugar do unique global de `name`; − `webhook_url`; + `webhook_on_connect_url?`, `webhook_on_disconnect_url?`, `webhook_on_receive_url?`, `webhook_on_message_status_url?`, `webhook_on_send_url?`; + `@@index([account_id])` | Decisões #1 e #5 |
| `outbox_message` | Sem mudança de schema (escopo vem via `device.account_id`) | — |

### 5.4 Diagrama de relacionamentos

```
[account] --(1:N)--> [user]
[account] --(1:N)--> [device] --(1:N)--> [outbox_message]
[account] --(1:N)--> [api_token]          [device] --(1:N)--> [auth_key]
```

### 5.5 Migração e backfill (risco alto — atenção)

1. Criar `account` e `api_token`.
2. Adicionar `account_id` **nullable** em `user` e `device`.
3. Backfill: **uma account por usuário existente** (`name` = nome do usuário); devices existentes (hoje sem dono) são atribuídos à account do usuário mais antigo. Se o banco não tiver usuários, devices órfãos bloqueiam o `NOT NULL` — resolver manualmente antes (ambiente atual é dev, dados descartáveis).
4. Tornar `account_id` `NOT NULL` + trocar o unique de `device.name`.
5. Remover `webhook_url` e adicionar as 5 colunas de webhook.

**Rollback:** migração aditiva até o passo 3 (reversível); passos 4–5 são destrutivos (unique + drop de coluna) — só aplicar depois de validar o backfill. Em produção futura com dados reais, os passos 4–5 exigiriam janela própria; hoje o custo é baixo.

---

## 6. Segurança (Nível: **ALTO**)

Nova superfície de autenticação (API token) + tenancy nova. Regras: R1 (todas as queries de tabela com dono filtram `account_id`), R3 (cross-account → `NotFoundError`, nunca `ForbiddenError`), R22 (token nunca em log/commit).

### 6.1 Autenticação da API pública

- Header: `Authorization: Bearer pmb_<40 hex>`.
- Middleware `apiTokenAuthMiddleware`: extrai token → SHA-256 → busca `api_token` ativo (`revoked_at = null`) → popula `req.apiAuth = { accountId, tokenId }` → atualiza `last_used_at` (fire-and-forget, sem bloquear a request).
- Falhas: `API_TOKEN_MISSING` (401) sem header; `API_TOKEN_INVALID` (401) para token desconhecido **ou revogado** (não vazar a distinção).
- **CSRF**: rotas `/api/v1/*` ficam **isentas** do middleware CSRF (auth por header, sem cookies). O rate limit global continua valendo + limiter dedicado por token (decisão #9).
- O token dá acesso **somente aos devices da account dona** (R1 em todos os use cases chamados).

### 6.2 Tabela de endpoints × auth

| Endpoint | Auth | Escopo | Validação | Audit |
|---|---|---|---|---|
| Rotas internas existentes (`/devices*`, `/messages*`) | JWT (cookie) | `account_id` do usuário logado | Zod (existente) | logs Pino |
| `GET /devices/:id/qr` (novo) | JWT | account | param uuid | — |
| `PATCH /devices/:id/webhooks` (novo) | JWT | account | Zod: 5 URLs http(s) opcionais | — |
| `GET /account/api-token` (novo) | JWT | account | — | — |
| `POST /account/api-token` (novo) | JWT | account | — | log de geração/revogação (sem o token) |
| `GET /api/v1/devices` (novo) | API token | account do token | — | `last_used_at` |
| `POST /api/v1/devices/:deviceId/send-text` (novo) | API token | account do token | Zod: `phone` E.164, `message` 1–4096 chars | `last_used_at` |

### 6.3 Dados sensíveis

| Dado | Classificação | Proteção |
|---|---|---|
| API token (claro) | segredo | Exibido uma vez; nunca persistido em claro; nunca logado; hash SHA-256 no banco |
| `webhook_secret` | segredo | Já existente: retornado uma vez no registro; assina HMAC dos webhooks |
| `phone` / `identifier` | PII | Não logar em claro (mascarar nos logs Pino); payloads de webhook contêm por necessidade do consumidor |
| URLs de webhook | config do cliente | Validar http(s); recusar payload > limite do body parser |

### 6.4 OWASP aplicável

| Vulnerabilidade | Mitigação |
|---|---|
| Broken auth (token de vida longa) | Hash at rest, revogação atômica na regeneração, 401 uniforme, rate limit por token |
| IDOR entre accounts | `account_id` obrigatório em **toda** query de `device`/`outbox_message`/`api_token`; cross-account responde 404 |
| SSRF via URL de webhook | Validação http(s) no MVP; bloqueio de IP privado/metadata documentado como hardening futuro (o dispatcher já roda com timeout de 5s e sem seguir redirects) |
| Brute force no token | 40 hex (160 bits) torna força bruta inviável; rate limit 401 |

---

## 7. Especificação — Backend

### 7.1 Prisma (delta)

```prisma
model account {
  id         String    @id @default(uuid())
  name       String
  created_at DateTime  @default(now())
  updated_at DateTime  @updatedAt
  deleted_at DateTime?

  users      user[]
  devices    device[]
  api_tokens api_token[]

  @@map("account")
}

model api_token {
  id                 String    @id @default(uuid())
  account_id         String
  token_hash         String    @unique
  token_prefix       String
  created_by_user_id String
  last_used_at       DateTime?
  revoked_at         DateTime?
  created_at         DateTime  @default(now())

  account account @relation(fields: [account_id], references: [id], onDelete: Cascade)

  @@index([account_id])
  @@map("api_token")
}

// user:   + account_id String (FK account, obrigatória após backfill)
// device: + account_id String (FK account); @@unique([account_id, name]);
//         - webhook_url
//         + webhook_on_connect_url / _on_disconnect_url / _on_receive_url /
//           _on_message_status_url / _on_send_url  (todas String?)
//         + @@index([account_id])
```

### 7.2 Módulos e use cases

| # | Use case | Módulo | Input | Output | Erros | Novo/Alterado |
|---|---|---|---|---|---|---|
| UC-01 | `sign-up` / `google-sign-in` | auth | (existente) | + cria `account` na mesma transação | — | Alterado |
| UC-02 | `generate-api-token` | **account** (novo) | `{ accountId, userId }` | `{ token }` (claro, única vez) | — | Novo |
| UC-03 | `get-api-token-metadata` | account | `{ accountId }` | `{ prefix, createdAt, lastUsedAt } \| null` | — | Novo |
| UC-04 | `register-device` | devices | + `accountId` | (existente) + `webhookSecret` única vez | `DEVICE_NAME_TAKEN` (por account) | Alterado |
| UC-05 | `list-devices` / `get-device` / `connect-device` / `delete-device` | devices | + `accountId` em tudo (R1) | (existente) | `DEVICE_NOT_FOUND` cross-account | Alterado |
| UC-06 | `get-device-qr` | devices | `{ accountId, deviceId }` | `{ status, qr: string \| null }` | `DEVICE_NOT_FOUND` | Novo |
| UC-07 | `update-device-webhooks` | devices | `{ accountId, deviceId, 5 URLs? }` | device atualizado | `DEVICE_NOT_FOUND`, `VALIDATION_ERROR` | Novo |
| UC-08 | `send-text-message` | messaging | + `accountId`; Idempotency-Key opcional (gera uuid se ausente); **emite `message.sent` no bus após aceite do gateway** | (existente, 202) | (existentes) | Alterado |
| UC-09 | `dispatch-webhook` | webhooks | resolve **URL por evento** (tabela § 7.4) | — | — | Alterado |

**Regras de negócio principais:**

- **UC-02:** transação: revoga token ativo (`revoked_at = now()`) → gera `pmb_` + 40 hex (crypto random) → persiste SHA-256 + prefixo de exibição → retorna claro uma única vez. Log de auditoria sem o token.
- **UC-06:** o `session-manager` passa a **cachear em memória o último QR** por device (hoje só emite no bus e loga no terminal). Cache limpo em `CONNECTED`/`LOGGED_OUT`/logout. `qr` só é retornado quando status = `QR_PENDING`; nos demais, `qr: null` (não é erro — o frontend usa o status para decidir a UI).
- **UC-07:** cada URL é opcional e validada como http(s); enviar `null` limpa o campo. `webhook_secret` **não** é alterado nem re-exposto.
- **UC-08:** `message.sent` carrega `{ deviceId, messageId, phone }` — **sem o texto** (decisão #6).

### 7.3 Endpoints REST

**Internos (JWT, superfície do frontend) — novos/alterados:**

| Verbo | Rota | Status | Response |
|---|---|---|---|
| GET | `/devices/:id/qr` | 200 | `{ ok, data: { status, qr } }` |
| PATCH | `/devices/:id/webhooks` | 200 | `{ ok, data: device }` |
| GET | `/account/api-token` | 200 | `{ ok, data: { prefix, createdAt, lastUsedAt } \| null }` |
| POST | `/account/api-token` | 201 | `{ ok, data: { token } }` |

**Públicos (`/api/v1`, API token) — novos:**

| Verbo | Rota | Status | Response |
|---|---|---|---|
| GET | `/api/v1/devices` | 200 | `{ ok, data: [{ id, name, identifier, status, lastConnectedAt, createdAt }] }` |
| POST | `/api/v1/devices/:deviceId/send-text` | 202 | `{ ok, data: { messageId, status: "PENDING" } }` |

O controller público **reusa** os use cases existentes (UC-05 list, UC-08 send) — nada de lógica duplicada; só auth + shape de DTO próprios. Estrutura: novo módulo `apps/api/src/modules/public-api/` (controller + routes + middleware + DTOs), consumindo use cases de `devices`/`messaging` via DI.

### 7.4 Webhooks — roteamento por evento

| Campo na UI | Coluna | Eventos entregues |
|---|---|---|
| Ao conectar | `webhook_on_connect_url` | `device.connected` |
| Ao desconectar | `webhook_on_disconnect_url` | `device.disconnected`, `device.logged_out` |
| Ao receber | `webhook_on_receive_url` | *(nenhum nesta versão — dormente, § 4)* |
| Status da mensagem | `webhook_on_message_status_url` | `message.status` |
| Ao enviar | `webhook_on_send_url` | `message.sent` *(novo)* |

Sem URL configurada para o evento → no-op silencioso (comportamento atual preservado). Assinatura HMAC, retry, `X-Event-Id`/`X-Signature`/`X-Timestamp` — tudo inalterado, com o mesmo `webhook_secret` por device.

### 7.5 Novos error codes

| Código | HTTP | Mensagem (pt-BR / en / es) |
|---|---|---|
| `API_TOKEN_MISSING` | 401 | "API token ausente" / "Missing API token" / "Falta el token de API" |
| `API_TOKEN_INVALID` | 401 | "API token inválido" / "Invalid API token" / "Token de API inválido" |

(`DEVICE_NAME_TAKEN`, `DEVICE_NOT_FOUND`, `DEVICE_OFFLINE`, `NUMBER_NOT_ON_WHATSAPP`, `IDEMPOTENCY_KEY_CONFLICT` já existem e são reusados.)

---

## 8. Especificação — Frontend

### 8.1 Rotas e navegação

| Rota (`ROUTE_PATHS`) | Página | Descrição |
|---|---|---|
| `devices: "/devices"` | `DevicesListPage` | Listagem + stats + criação |
| `deviceDetail: "/devices/:id"` | `DeviceDetailPage` | Status, conexão/QR, webhooks, exclusão |

Sidebar (`navigation.ts`): item **"Dispositivos"** (ícone `Smartphone`, lucide) entre Dashboard e Settings.

### 8.2 Páginas e composição (reuso primeiro)

**`DevicesListPage`** — `PageHeader` (título + botão "Adicionar") → 3 `StatCard` (total / conectadas / desconectadas, derivados da própria lista) → `ListPageLayout` com `EntityCard` por device (nome, `StatusBadge` por status, identifier, último acesso) + `FilterBar` (busca + filtro Todas/Conectadas/Desconectadas) + `EmptyState` com CTA "Adicionar dispositivo". Botão Adicionar abre **`CreateDeviceModal`** (`AppModal` + `FormField` nome, via `useFormState`): ao criar → **modal de segredo** (exibe `webhookSecret` uma única vez, copy-to-clipboard, aviso "guarde agora") → navega para o detalhe.

**`DeviceDetailPage`** — `DetailPageGuard` +:
- **Seção status** (`SectionCard`): `StatusBadge`, número pareado, última conexão, botão **Conectar** (abre `QrConnectModal`) quando desconectada, botão Desconectar/Excluir (`ConfirmDialog`).
- **Seção webhooks** (`SectionCard`): 5 `FormField` de URL com `useDetailPageController` (autosave + `SaveButton` + `useUnsavedChangesGuard`); campo "Ao receber" com helper text "armazenada, mas ainda não disparada nesta versão" (§ 4).

**`QrConnectModal`** — dispara `POST /devices/:id/connect` ao abrir → poll `GET /devices/:id/qr` com `refetchInterval: 3000` (TanStack Query, ativo só com o modal aberto) → renderiza o QR string com a lib `qrcode` (canvas/dataURL) → quando status vira `CONNECTED`: feedback de sucesso, invalidação seletiva de `queryKeys.devices.detail(id)` e `.list()`, fecha. Skeleton enquanto QR não chega; expiração do QR é transparente (o poll traz o QR rotacionado).

**`ApiTokenTab`** (nova tab "API" em `SettingsPage`/`AppTabs`) — estado vazio (`EmptyState` + CTA "Gerar token") ou metadados (prefixo, criado em, último uso) + botão "Gerar novo token" com `ConfirmDialog` ("o token atual será revogado imediatamente") → modal de exibição única com copy. Inclui bloco curto de instrução de uso (`Authorization: Bearer …`).

### 8.3 Data layer

| Item | Detalhe |
|---|---|
| `HttpDevicesRepository` | `list`, `getById`, `create`, `updateWebhooks`, `connect`, `getQr`, `delete` — registrado em `core/di/repositories.ts` (R13) |
| `HttpAccountRepository` | `getApiToken`, `generateApiToken` — registrado idem |
| `queryKeys.devices` | factory `all / list / detail(id) / qr(id)` em `core/query/queryKeys.ts` |
| `queryKeys.account` | `apiToken()` |
| Hooks | `useDevicesList` (via `useEntityList`), `useDeviceDetail` (via `useEntityDetail`), `useConnectDevice`, `useDeviceQr` (polling), `useApiToken`, `useGenerateApiToken` — todos com `onError` (R14) |

### 8.4 Estados de UI (obrigatórios)

| Estado | Comportamento |
|---|---|
| Loading | `ListPageSkeleton` / `DetailPageSkeleton` / skeleton no QR |
| Empty | `EmptyState` com CTA (listagem e tab API) |
| Error | toast via `useNotify().showError` + retry onde couber |
| Success | invalidação seletiva + feedback visual (toast/confirm) |

### 8.5 i18n

Namespace novo **`devices`** + chaves novas em **`settings`** (tab API), nos 3 locales (pt-BR, en, es) — R15/R20. Principais chaves: títulos/CTAs da listagem e detalhe, labels dos 5 webhooks + helper texts, estados do QR (aguardando, escaneie, conectado, expirado), fluxo do token (gerar, revogar, aviso de exibição única).

---

## 9. Testes

### 9.1 Unitários backend (Vitest, R24 — co-located `*.spec.ts`) → `/test`

| Alvo | Cenários-chave |
|---|---|
| `generate-api-token.use-case` | gera formato `pmb_`; revoga o anterior atomicamente; hash persistido ≠ claro; um ativo por account |
| `apiTokenAuthMiddleware` | sem header → 401 MISSING; token desconhecido → 401 INVALID; revogado → 401 INVALID; válido popula `accountId`; `last_used_at` atualizado |
| `get-device-qr.use-case` | QR quando `QR_PENDING`; `qr: null` nos demais status; cross-account → `DEVICE_NOT_FOUND` |
| `update-device-webhooks.use-case` | URLs válidas salvam; inválidas → `VALIDATION_ERROR`; `null` limpa; secret intocado |
| `send-text-message.use-case` (delta) | Idempotency-Key ausente → uuid gerado; `message.sent` emitido sem texto no payload; escopo por account |
| `dispatch-webhook.use-case` (delta) | roteamento evento→coluna correto (tabela § 7.4); URL ausente → no-op; `logged_out` → URL de desconexão |
| `sign-up` (delta) | account criada na mesma transação; falha → rollback total |
| Escopo account (todos os use cases de devices) | user A não vê/conecta/apaga device da account B (404) |
| DTOs novos | `send-text` público (phone E.164, message 1–4096), webhooks (http(s) ou null) |

### 9.2 E2E (Playwright) → `/test-e2e`

| Fluxo | Passos |
|---|---|
| Listagem vazia → criação | login → /devices → EmptyState → criar via modal → modal do secret → detalhe |
| Configurar webhooks | detalhe → preencher 2 URLs → salvar → recarregar → valores persistidos |
| Token de API | settings → tab API → gerar → modal de exibição única → gerar novo → confirm de revogação |
| QR (mock do gateway) | conectar → modal exibe QR renderizado → status muda → sucesso |

---

## 10. Dependências

**Reuso (já no código):** tudo do § 5.1. **Criar:** módulos/arquivos listados nos § 7–8 (sem novos pacotes npm no backend). **Frontend:** lib `qrcode` já instalada — adicionar somente `@types/qrcode` (dev) se ausente. **Nenhuma dependência externa nova de runtime.**

---

## 11. Plano de execução

A implementação é grande demais para um PR único. Sugestão: **4 branches/PRs sequenciais**, cada um passando pelo fluxo completo (`/start-task` → especialista → `/finish-task`):

| PR | Escopo | Skill | Est. arquivos | Complexidade |
|---|---|---|---|---|
| **PR 1 — Fundação de tenancy** | `account` + `api_token` no schema, migração + backfill (§ 5.5), signup cria account, `authMiddleware` popula `accountId`, escopo `account_id` em todos os use cases/repos de devices/messaging, endpoints `/account/api-token` | `/backend` + `/test` | ~30–40 | **L** |
| **PR 2 — QR + webhooks + API pública** | Cache de QR no session-manager + `GET /devices/:id/qr`, `PATCH /devices/:id/webhooks` (5 colunas), evento `message.sent`, roteamento por evento no dispatch, módulo `public-api` (`/api/v1` + middleware de token + rate limit por token + isenção CSRF) | `/backend` + `/test` | ~25–35 | **M/L** |
| **PR 3 — Frontend completo** | Módulo `devices` (listagem, detalhe, modais de criação/secret/QR), tab API em settings, rotas, sidebar, repositórios, query keys, i18n ×3 | `/frontend` | ~30–40 | **L** |
| **PR 4 — E2E** | Specs Playwright dos 4 fluxos (§ 9.2) | `/test-e2e` | ~6–10 | **S/M** |

**Ordem e paralelização:** PR 1 → PR 2 (dependência dura). PR 3 pode começar após o PR 2 estar em review (contratos de API já definidos aqui neste documento). PR 4 por último.

**Riscos de implementação:**

| Risco | Prob. | Impacto | Mitigação |
|---|---|---|---|
| Backfill de tenancy com dados inconsistentes | média | alto | Passos aditivos primeiro (§ 5.5); validar contagens antes do `NOT NULL`; ambiente atual é dev |
| QR expirar entre polls / UX confusa | média | médio | Poll de 3s + QR rotacionado transparente; estados claros no modal |
| Regressão nos webhooks existentes (URL única → 5) | baixa | alto | Testes de roteamento § 9.1 antes de remover `webhook_url`; sender intocado |
| Token vazado em log/response | baixa | crítico | Nunca logar claro; testes garantem hash at rest; revisão `/security` no PR 1 e PR 2 |

---

## 12. Critérios de aceite (ACs — verificados pelo `/finish-task` de cada PR)

- **AC-1** Signup cria `account` automaticamente; todo dado de device/token é escopado por `account_id`; acesso cross-account responde 404.
- **AC-2** Usuário cria dispositivo pela UI (modal com nome), recebe o `webhookSecret` **uma única vez** e cai na página de detalhe.
- **AC-3** Botão Conectar exibe QR renderizado via polling de 3s; ao escanear, o status na tela muda para `CONNECTED` sem reload manual.
- **AC-4** Listagem `/devices` mostra stats (total/conectadas/desconectadas), busca, filtro por status, empty state com CTA.
- **AC-5** As 5 URLs de webhook são configuráveis por dispositivo com autosave; "ao receber" é persistida mas não disparada; eventos são entregues conforme a tabela § 7.4 (incl. novo `message.sent` sem conteúdo).
- **AC-6** Tab API nas configurações gera token `pmb_…` exibido uma única vez; gerar novo revoga o anterior imediatamente; UI mostra prefixo, criação e último uso.
- **AC-7** `GET /api/v1/devices` e `POST /api/v1/devices/:deviceId/send-text` funcionam apenas com token válido (`Authorization: Bearer`); token revogado/inexistente → 401; rate limit por token ativo; envio retorna 202 com `messageId`.
- **AC-8** Comportamentos do § 4 permanecem fixos (nenhuma UI/coluna de configuração de recebimento); nenhuma mensagem recebida é processada.
- **AC-9** Todos os use cases/DTOs/controllers novos ou alterados têm `*.spec.ts` co-locado (R24) e os 4 fluxos E2E do § 9.2 passam.

## 13. Diff budget

| PR | Budget |
|---|---|
| PR 1 | ≤ 45 arquivos / ~1.800 linhas |
| PR 2 | ≤ 40 arquivos / ~1.500 linhas |
| PR 3 | ≤ 45 arquivos / ~2.200 linhas |
| PR 4 | ≤ 12 arquivos / ~800 linhas |

Estourar o budget exige justificativa no PR body (R27).
