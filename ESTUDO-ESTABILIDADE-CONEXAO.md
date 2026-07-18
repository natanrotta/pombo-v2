# Estudo de Engenharia — Estabilidade de Conexão de Dispositivos (WhatsApp / Baileys)

> **Status:** documento de estudo para **debate de soluções**. Não é uma implementação.
> **Objetivo:** entender por que um dispositivo desconecta sozinho (sem ação do usuário),
> como o mercado trata o problema, e propor uma estrutura de engenharia séria e robusta
> para maximizar a estabilidade da conexão.
> **Escopo do código analisado:** `apps/api/src/modules/devices/**` e
> `apps/api/src/core/service/whatsapp/**` no branch `develop`.

---

## 1. Sumário executivo (TL;DR)

A base atual é **madura e bem projetada** — não estamos partindo do zero. Os acertos
importantes já existem: gateway Baileys com _import_ preguiçoso, `authState` persistido no
Postgres (deploy não re-pareia), _lock_ consultivo (advisory lock) garantindo **exatamente
um _replica_ dono dos sockets**, re-hidratação no boot, `markOnlineOnConnect: false` (não
rouba as notificações do dono do chip) e `syncFullHistory: false`.

O problema de "desconecta sozinho" tem **duas famílias de causa**:

1. **Causas externas / de protocolo** — inerentes a usar o protocolo _não-oficial_ do
   WhatsApp Web (Baileys). Não controlamos, mas podemos **reagir corretamente** a elas.
2. **Causas auto-infligidas** — decisões da nossa engenharia que _transformam_ um soluço
   transitório em uma queda prolongada, ou que _causam_ a queda. **Essas nós controlamos.**

O diagnóstico central é: **a nossa lógica de reconexão trata todos os motivos de queda como
iguais** (só distingue "deslogado" de "todo o resto → reconecta"). Essa é a principal fonte
de instabilidade auto-infligida. Somado a isso: o _backoff_ nunca reseta depois de uma
conexão estável, não há _jitter_ (todos reconectam em sincronia → efeito manada), não há
cache na _store_ de chaves Signal (risco de corrupção → `badSession` → re-pareamento
forçado, que o usuário lê como "desconectou sozinho"), e não há observabilidade das causas
(hoje é impossível responder "quais são os principais motivos de desconexão" com dados).

O plano proposto tem 3 ondas: **(1) Quick wins** que reduzem drasticamente a instabilidade
auto-infligida sem mudar arquitetura; **(2) Observabilidade + auto-cura** para medir,
diagnosticar e recuperar sozinho; **(3) Decisão estratégica** sobre escala (sharding de
sessões) e sobre adotar a **API oficial (Cloud API)** para números que exigem SLA.

---

## 2. Como funciona hoje (a fotografia real do código)

### 2.1 Topologia

```
                 ┌──────────────────────────────────────────────────┐
                 │  processo único (advisory lock: 1 replica dona)  │
                 │                                                  │
  WhatsApp  <══ws══>  Baileys WASocket ── sock.ev ──> SessionManager │
  servers            (1 por deviceId)                 Map<id,socket> │
                 │                                        │          │
                 │                                        ▼          │
                 │                              DomainEventBus        │
                 │                    session.qr / connected /        │
                 │                    disconnected / logged_out       │
                 │                          │        │        │       │
                 │                     devices    webhooks  messaging  │
                 │                  (status DB)  (debounce)  (outbox)   │
                 └──────────────────────────────────────────────────┘
                                     Postgres: auth_key (Signal state)
                                               device (status, lastConnectedAt)
```

Arquivos-âncora:

| Papel | Arquivo |
|---|---|
| Dono dos sockets vivos + tradução `sock.ev` → bus | `modules/devices/infrastructure/provider/session-manager.ts` |
| Config do socket Baileys | `modules/devices/infrastructure/provider/socket-config.ts` |
| `authState` sobre Postgres | `modules/devices/infrastructure/provider/prisma-auth-state.ts` |
| Adapter/porta (lazy import de Baileys) | `modules/devices/infrastructure/provider/baileys-whatsapp.gateway.ts` |
| Boot: lock + re-hidratação + shutdown | `core/service/whatsapp/gateway-boot.ts` |
| Advisory lock (1 replica) | `core/service/whatsapp/advisory-lock.ts` |
| Reações de ciclo de vida (status no DB) | `modules/devices/application/use-case/devices/handle-session-*.use-case.ts` |
| Debounce de flap p/ webhook | `modules/webhooks/infrastructure/provider/http-disconnect-debouncer.ts` |
| Health do gateway | `modules/devices/infrastructure/health/gateway-health.ts` |

### 2.2 O que já está certo (não regredir)

- **Advisory lock de replica única** (`advisory-lock.ts`): dois processos compartilhando o
  mesmo `authState` corromperiam as chaves Signal. O lock em conexão `pg` dedicada, com
  _heartbeat_ e `process.exit(1)` ao perder o lock, é a decisão correta para segurança.
- **`authState` no Postgres** (`prisma-auth-state.ts`): estado Signal (cripto que muta a cada
  mensagem) persistido com `BufferJSON`. Deploy vira não-evento.
- **`markOnlineOnConnect: false`** (`socket-config.ts`): não marca online, então o celular
  do dono continua recebendo _push_. Correto.
- **Reserva síncrona de _slot_** (`session-manager.ts:101`): `pending` evita dois `openSocket`
  concorrentes criarem dois sockets no mesmo `authState`.
- **`unref()` no timer de reconexão** (`session-manager.ts:208`): não segura o processo no
  `SIGTERM`.
- **Debounce de desconexão para webhook** (`http-disconnect-debouncer.ts`): um flap curto
  (cai e volta em < `DISCONNECT_DEBOUNCE_MS`) **não** dispara webhook de `device.disconnected`.
  Bom — mas note (§3) que isso só protege o _webhook_, não o status no DB nem a reconexão.

### 2.3 A lógica de reconexão, exatamente como está

`session-manager.ts` — handler de `connection.update`, ramo `connection === "close"`:

```ts
if (connection === "close") {
  openDevices.delete(deviceId);
  sockets.delete(deviceId);
  lastQr.delete(deviceId);
  if (shuttingDown) return;

  if (closeStatusCode(lastDisconnect?.error) === DisconnectReason.loggedOut) {
    deps.bus.publish({ type: "session.logged_out", deviceId });   // ← único caso tratado
    return;
  }

  if (attempt === 0) {                                            // ← só publica no 1º drop
    deps.bus.publish({ type: "session.disconnected", deviceId, reason: "connection closed" });
  }
  const delay = Math.min(
    deps.config.reconnectBaseDelayMs * 2 ** attempt,             // 3s · 2^attempt
    deps.config.reconnectMaxDelayMs,                             // teto 300s (5 min)
  );
  setTimeout(() => void openSocket(deviceId, attempt + 1), delay).unref();
}
```

Config atual (`core/config/env.ts`):

| Env | Default | Papel |
|---|---|---|
| `RECONNECT_BASE_DELAY_MS` | `3000` | base do _backoff_ |
| `RECONNECT_MAX_DELAY_MS` | `300000` | teto do _backoff_ (5 min) |
| `DISCONNECT_DEBOUNCE_MS` | `30000` | janela p/ colapsar flap **no webhook** |
| `ADVISORY_LOCK_HEARTBEAT_MS` | `30000` | _heartbeat_ do lock |
| `WEBHOOK_TIMEOUT_MS` / `WEBHOOK_MAX_ATTEMPTS` | `5000` / `4` | entrega de webhook |

`socket-config.ts` **não** define `keepAliveIntervalMs`, `connectTimeoutMs`,
`defaultQueryTimeoutMs` nem `retryRequestDelayMs` → todos ficam no _default_ do Baileys.

---

## 3. Taxonomia das causas de desconexão inesperada

Cada linha marca se a causa é **externa** (não controlamos a origem, só a reação) ou
**auto-infligida** (nossa engenharia), e como o código atual se comporta.

### 3.1 Causas de protocolo / externas

| # | Causa (motivo Baileys) | O que é | Reação **correta** | Reação **atual** |
|---|---|---|---|---|
| 1 | `restartRequired` (515) | WhatsApp força restart logo após parear — **é normal**, não é erro | Reabrir socket **imediatamente** (delay ~0) | Entra no _backoff_ genérico (espera 3s+; funciona, mas atrasa o pareamento) |
| 2 | `connectionReplaced` (440) | Outra sessão do mesmo número assumiu (usuário abriu WhatsApp Web em outro lugar, limite de dispositivos vinculados, ou corrida no nosso reconnect) | **Parar** e marcar; reconectar aqui é brigar pela sessão → flap infinito | **Reconecta** — briga pela sessão |
| 3 | `connectionLost` / `timedOut` (408) | Soluço de rede / WS caiu | _Backoff_ com _jitter_ | _Backoff_ sem _jitter_ |
| 4 | `connectionClosed` (428) | WS fechado pelo servidor | _Backoff_ com _jitter_ | _Backoff_ sem _jitter_ |
| 5 | `badSession` (500) | Estado Signal corrompido | Reconectar **em loop não resolve**: precisa limpar chaves e re-parear | **Reconecta em loop** (nunca sai do 500) |
| 6 | `loggedOut` (401) | Usuário desvinculou pelo celular, ou WhatsApp forçou | **Parar** e re-parear | ✅ Tratado corretamente |
| 7 | `forbidden` (403) / `multideviceMismatch` (411) | Número banido / incompatibilidade de protocolo | **Parar** (não martelar número banido) | **Reconecta** — martela |
| 8 | Celular offline > ~14 dias | WhatsApp desvincula dispositivos-companheiros se o telefone primário não aparece | Reeducar usuário; detectar e alertar | Vira `loggedOut` no boot seguinte, sem contexto |
| 9 | Versão do WhatsApp Web defasada | Servidor rejeita cliente velho | Atualizar a versão periodicamente | `fetchLatestBaileysVersion` é **cacheado para a vida inteira do processo** (`session-manager.ts:89`) → processo longevo fixa versão cada vez mais velha |
| 10 | Rate-limit / heurística anti-spam | Ban temporário por volume/velocidade | Throttle de envio, _warmup_ de número | Sem throttle por dispositivo |

### 3.2 Causas auto-infligidas (as que dependem só de nós)

| # | Problema | Onde | Efeito |
|---|---|---|---|
| A | **Reconexão cega**: todo motivo ≠ `loggedOut` reconecta | `session-manager.ts:182-208` | Briga em `connectionReplaced`, martela `forbidden`, faz loop em `badSession`. **Maior fonte de flap auto-infligido.** |
| B | **_Backoff_ nunca reseta** após conexão estável | `attempt` é fixado no _closure_ do socket; `open` não zera | Um device que piscou 7× cedo (3→6→12→24→48→96→192→300s) fica **preso em 5 min de recuperação para sempre**, mesmo após horas estável |
| C | **Sem _jitter_** + boot reconecta **todos de uma vez** | `gateway-boot.ts:99-101` (`for … void gateway.connect`) | Efeito manada: N devices reconectam em sincronia → auto-DDoS no WhatsApp → rate-limit → **mais** quedas |
| D | **_Store_ de chaves Signal sem cache e sem atomicidade** | `prisma-auth-state.ts:53-90` | `keys.get` bate no Postgres a cada leitura (Baileys lê muito ao descriptografar) → latência/timeout; `keys.set` faz N _upserts_ soltos em `Promise.all` sem transação → _crash_ no meio = estado parcial = **`badSession` = re-pareamento** |
| E | **`keepAlive`/timeouts no default** | `socket-config.ts` | O _default_ pode não sobreviver ao _idle timeout_ de NAT/proxy do host → WS morre em silêncio |
| F | **Sem detecção de socket-zumbi** | health é passivo (lê status do DB) | TCP _half-open_: Baileys acha que está conectado, DB diz `CONNECTED`, mas o envio falha/pendura. Ninguém percebe |
| G | **`session.disconnected` só publica no `attempt === 0`** | `session-manager.ts:190` | Durante uma tempestade de reconexão só o **primeiro** drop atualiza o DB. Device preso reconectando fica "mudo"; status não volta a `CONNECTING` |
| H | **Sem telemetria da causa** | motivo real (`lastDisconnect.error`) nunca é logado/persistido — `reason` é a string fixa `"connection closed"` | **Impossível** responder "quais os principais motivos de desconexão" com dados |
| I | **Sem teto / circuit breaker / alerta** | reconexão infinita | Device banido/quebrado martela para sempre, em silêncio |
| J | **Health = 503 se QUALQUER device ≠ CONNECTED** | `gateway-health.ts:29` | Um device em QR_PENDING derruba o `/health` inteiro → orquestrador pode **matar o processo** → **todos** caem → manada de reconexão. _Loop_ de realimentação destrutivo |
| K | **Ownership em processo único** | `advisory-lock.ts` (1 replica) | Correto p/ segurança, mas: (a) **SPOF**; (b) todo deploy/crash derruba **todos** os devices juntos; (c) teto de escala = o que 1 processo aguenta |
| L | **Sem drain do outbox na reconexão** | `send-text` lança `DEVICE_OFFLINE` síncrono | Mensagem enfileirada enquanto offline não é reenviada sozinha quando o device volta (a confirmar §5.2) |
| M | **Arquivo duplicado acidental** | `devices.module 2.ts` | Versão órfã (com decorator de cache) ao lado do módulo ativo. Ruído/risco de confusão |

---

## 4. Como o mercado trata isso

### 4.1 A verdade incômoda: Baileys é protocolo _não-oficial_

Baileys fala o protocolo do **WhatsApp Web** (dispositivo-companheiro). Isso implica limites
estruturais que **nenhuma engenharia elimina**: o WhatsApp pode desvincular o companheiro se
o celular primário some por ~14 dias, pode rejeitar por versão defasada, e pode banir por
heurística de spam. A comunidade convive com quedas periódicas mesmo em setups maduros — as
_issues_ do repositório oficial de quedas "aleatórias" em produção são numerosas e recorrentes.
Portanto o alvo realista não é "zero queda"; é **"queda rara, detectada, e recuperada em
segundos sem intervenção humana"**.

### 4.2 O consenso técnico da comunidade Baileys

- **Reagir por motivo, não em bloco.** O padrão canônico é um `shouldReconnect(statusCode)`:
  nunca reconectar em `loggedOut`; reconexão imediata em `restartRequired`; tratar `badSession`
  como "limpar e re-parear", não como "tentar de novo". → resolve §3.2-A.
- **`makeCacheableSignalKeyStore` na frente da _store_.** O próprio Baileys recomenda envolver a
  _store_ de chaves com um cache em memória — melhora _throughput_ de envio/recebimento e reduz a
  pressão/latência de I/O que causa timeouts. `useMultiFileAuthState` "nunca foi feito para
  produção"; o par recomendado é **SQL + `makeCacheableSignalKeyStore`**. → resolve §3.2-D.
- **`keepAliveIntervalMs` explícito** (valores citados na ordem de ~25s) para manter o WS vivo
  contra _idle timeouts_. → resolve §3.2-E.
- **_Backoff_ com _jitter_** para evitar efeito manada em reconexões simultâneas. → §3.2-C.

### 4.3 Como os produtos do mercado escalam (WAHA / Evolution API / wppconnect)

| Produto | Padrão relevante |
|---|---|
| **WAHA** | _Engine_ **NOWEB** (Baileys, WebSocket, sem Chromium) escala **~500 sessões por servidor** verticalmente; acima disso, **sharding horizontal**: várias instâncias, sessões distribuídas por _hashing_ na lógica da aplicação. |
| **Evolution API** | Arquitetura **dual-engine**: Baileys **e** Cloud API oficial na mesma plataforma. Baileys para flexibilidade/custo; Cloud API para quem precisa de entrega garantida. |
| **wppconnect** | Multi-sessão + webhooks; mesma classe de problema de estabilidade da Web protocol. |
| **Consenso** | Cliente não-oficial **pode violar os Termos e arrisca ban** → manter _rate_ de envio baixo, fazer _warmup_ de número, e considerar a **Cloud API oficial** para volume/compliance. |

**Leitura para o pombo:** hoje prendemos **todas** as sessões em **um** processo (lock único).
O mercado, para escalar e para tornar deploy um não-evento, faz o oposto: **espalha sessões
entre workers** com um coordenador (cada worker dona um subconjunto). E, para números que
exigem SLA de verdade, adota a **API oficial**.

### 4.4 O endgame de estabilidade: WhatsApp Cloud API (oficial)

A Cloud API da Meta é hospedada pela Meta: **não** existe conceito de "dispositivo-companheiro
que cai", entrega é garantida, sem risco de ban por uso legítimo. Custos: é **paga** (por
conversa), exige **verificação de negócio** e tem **conjunto de features diferente** (templates,
janela de 24h, etc.). Não é substituição 1:1 do Web protocol, mas é a resposta definitiva para
os números onde a instabilidade do Baileys é inaceitável. O padrão Evolution API (dual-engine)
mostra que dá para conviver: **por número**, escolher Baileys ou Cloud API.

---

## 5. Recomendações (priorizadas por esforço × impacto)

### 5.1 Onda 1 — Quick wins (endurecer o gateway atual, sem mudar arquitetura)

> Alvo: **eliminar a instabilidade auto-infligida.** Baixo risco, alto impacto.

1. **Política de reconexão por motivo** (`session-manager.ts`). Introduzir
   `classifyDisconnect(statusCode) → { action, label }` com os casos:
   `restartRequired → reconnect-immediate`; `loggedOut | forbidden | multideviceMismatch →
   stop`; `badSession → reset-and-repair`; demais transitórios → `reconnect-backoff`.
   Trocar por membros do enum `DisconnectReason`, **nunca** números mágicos. → §3.2-A, §3.1-1/2/5/7.
2. **Resetar o _backoff_ no `open`.** Mover `attempt` para um `Map<deviceId, number>` no manager,
   zerar em `connection === "open"`, incrementar ao agendar. → §3.2-B.
3. **_Jitter_ + escalonar o boot.** `delay = random_between(0.5·d, d)` sobre o `d` exponencial;
   espalhar as `connect()` do boot ao longo de alguns segundos. → §3.2-C.
4. **Capturar e logar o motivo real** em todo `close` (statusCode + mensagem), e propagá-lo no
   evento `session.disconnected` (o campo `reason` já existe — hoje é fixo). Matéria-prima do
   relatório de causas. → §3.2-H.
5. **Tunar `socket-config.ts`**: `keepAliveIntervalMs` (~25s), `connectTimeoutMs`,
   `defaultQueryTimeoutMs`, `retryRequestDelayMs`. Barato e relevante. → §3.2-E.
6. **Renovar a versão do WhatsApp Web** periodicamente (TTL no `cachedVersion`, ou re-buscar a
   cada reconexão) em vez de fixar para a vida do processo. → §3.1-9.
7. **Corrigir a semântica do `/health`.** _Liveness_ do processo = "lock em mãos + event loop
   vivo", **não** "todos os devices conectados". Conectividade por device é _readiness_/métrica
   separada. Quebra o loop de "matar o processo → todos caem". → §3.2-J.
8. **Remover `devices.module 2.ts`** (duplicado órfão). → §3.2-M.

### 5.2 Onda 2 — Observabilidade + auto-cura (medir, diagnosticar, recuperar sozinho)

> Alvo: **transformar "cai às vezes" em dados** e recuperar sem humano.

9. **Cache + atomicidade na _store_ de chaves.** Envolver com `makeCacheableSignalKeyStore` e
   escrever o lote de `keys.set` em **uma transação**. Resolve latência **e** o `badSession` por
   escrita parcial. → §3.2-D, §3.1-5.
10. **Telemetria de conexão por device.** Persistir `lastDisconnectedAt`, `lastDisconnectReason`,
    `disconnectCount`, `reconnectCount`, janelas de _uptime_ (coluna ou tabela append-only
    `device_connection_event`). É o que produz o **ranking de causas**. → §3.2-H.
11. **Endpoint de métricas (Prometheus).** Sessões conectadas (_gauge_), desconexões por motivo
    (_counter_), tempo-até-reconectar (_histogram_). Já existe scrape de `node_exporter` — plugar
    no mesmo _dashboard_.
12. **Watchdog de _liveness_ ativo.** Probe leve periódico por device conectado (ex.
    `sendPresenceUpdate` ou query barata); em falha/timeout, cicla o socket proativamente. Mata
    zumbis. → §3.2-F.
13. **Circuit breaker + alerta.** Após N reconexões falhas ou T minutos offline: parar o loop
    apertado, marcar estado `STALLED`/degradado, emitir alerta/webhook e cair para uma cadência
    lenta de tentativa. → §3.2-I.
14. **Drain do outbox na reconexão.** Ao voltar a `CONNECTED`, reprocessar mensagens `PENDING`
    enfileiradas enquanto offline (confirmar o comportamento atual do `send-text`). Estabilidade
    de **entrega** sob _churn_ de conexão. → §3.2-L.

### 5.3 Onda 3 — Decisão estratégica (arquitetura e SLA) — **isto é o debate**

15. **Sharding de sessões entre workers.** Substituir o lock global único por ownership
    **por device/shard** + coordenador, com N workers cada um dono de um subconjunto. Remove o
    SPOF, habilita escala horizontal e torna deploy **rolling** (só os devices do shard afetado
    piscam). Precedente: WAHA NOWEB ~500/box, depois sharding. → §3.2-K.
16. **Cloud API oficial por número.** Para os números que exigem SLA, adotar a API oficial
    (sem companheiro que cai, entrega garantida, sem ban). Modelo dual-engine (Evolution API):
    **por número**, Baileys ou Cloud API. Custo/verificação vs estabilidade. → §4.4.

---

## 6. Roadmap sugerido

| Fase | Entrega | Resultado esperado |
|---|---|---|
| **F1** (Onda 1) | Reconexão por motivo, reset de backoff, jitter+boot escalonado, log de causa, tuning de socket, health correto, limpeza do duplicado | Queda de flap auto-infligido; recuperação em segundos; deploy sem 503 em cascata |
| **F2** (Onda 2, parte A) | Cache+atomicidade na store; telemetria por device; métricas Prometheus | Fim do `badSession` por escrita parcial; **ranking de causas com dados reais** |
| **F3** (Onda 2, parte B) | Watchdog ativo; circuit breaker+alerta; drain do outbox | Auto-cura de zumbis; nada martela em silêncio; entrega resiliente a churn |
| **F4** (Onda 3) | Sharding OU Cloud API (decisão em §7) | Escala horizontal e/ou SLA por número |

Sequência recomendada: **medir antes de re-arquitetar.** F1+F2 dão os dados que dizem se F4
(sharding/oficial) é necessário agora ou pode esperar.

---

## 7. Perguntas para o debate (decisões que dependem de você)

1. **Escala-alvo:** quantos devices/números simultâneos em 6–12 meses? Isso decide se
   **sharding (§5.3-15)** é urgente ou pode ficar para depois.
2. **Deploy hoje dói?** O _blip_ de "todos caem no deploy" (processo único) já está incomodando
   em produção, ou é aceitável no curto prazo?
3. **Apetite pela Cloud API oficial** para um subconjunto de números (custo por conversa +
   verificação de negócio vs estabilidade e entrega garantida)?
4. **Onde mora a telemetria de conexão** — colunas no `device`, tabela append-only de eventos,
   ou só métricas (sem histórico)? Trade-off custo de storage × poder de diagnóstico.
5. **SLA por device:** qual meta de _uptime_ (%) e de **tempo máximo até reconectar** vamos
   perseguir? Isso calibra os valores de _backoff_, o teto do circuit breaker e o watchdog.
6. **Onda 1 é consenso?** Sugiro começar por ela imediatamente — é baixo risco e ataca a maior
   fonte de "desconecta sozinho" (a reconexão cega). Se concordar, o próximo passo é escrever a
   Task Spec da F1 e implementar.

---

## Apêndice A — Referências

- Baileys — Connection Lifecycle / Connecting: <https://baileys.wiki/docs/socket/connecting/> · <https://whiskeysockets-baileys-94.mintlify.app/concepts/connection>
- Baileys — `DisconnectReason` (enum): <https://baileys.wiki/docs/api/enumerations/DisconnectReason/>
- Issues de referência (quedas em produção, badSession, logout espontâneo):
  [#2052](https://github.com/WhiskeySockets/Baileys/issues/2052) ·
  [#1895](https://github.com/WhiskeySockets/Baileys/issues/1895) ·
  [#860](https://github.com/WhiskeySockets/Baileys/issues/860) ·
  [#1965](https://github.com/WhiskeySockets/Baileys/issues/1965) ·
  [#2110](https://github.com/WhiskeySockets/Baileys/issues/2110)
- WAHA — Scaling to 500+ sessions: <https://dev.to/waha/waha-scaling-how-to-handle-500-whatsapp-sessions-3fie>
- Evolution API (dual-engine Baileys + Cloud API): <https://github.com/EvolutionAPI/evolution-api>

## Apêndice B — Índice de causa → correção

| Causa (§3) | Correção (§5) |
|---|---|
| A — reconexão cega | 1 (política por motivo) |
| B — backoff não reseta | 2 |
| C — sem jitter / manada | 3 |
| D — store sem cache/atomicidade | 9 |
| E — keepAlive default | 5 |
| F — socket zumbi | 12 (watchdog) |
| G — evento só no attempt 0 | 4 + 10 |
| H — sem telemetria de causa | 4, 10, 11 |
| I — sem circuit breaker | 13 |
| J — health derruba processo | 7 |
| K — processo único / SPOF | 15 (sharding) |
| L — sem drain do outbox | 14 |
| M — arquivo duplicado | 8 |
| §3.1-9 — versão WA cacheada | 6 |
