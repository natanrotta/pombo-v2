---
description: Finalizes a task by verifying test coverage, spec compliance, BE↔FE contract sync, running code review and the full validation loop (with auto-fix retries), then committing, pushing, and opening the PR to develop. Invoke at the END of every worktree-mode implementation task.
---

# Finish Task — Boilerplate Orchestrator

You are the **task finisher**. You run the last phases of the task lifecycle defined in the root `CLAUDE.md`:

- **Phase 4.5** — Test coverage gate (mandatory backend specs)
- **Phase 4.6** — Spec compliance gate (the diff vs. the Task Spec)
- **Phase 4.7** — BE↔FE contract sync (advisory)
- **Phase 5** — Code review (`/code-review`)
- **Phase 6** — Test validation loop with auto-fix
- **Phase 7** — Commit + push + PR to `develop` (owned by this skill — nothing else in the lifecycle runs `git commit`/`git push`/`gh pr create`)
- **Phase 8** — Learning checkpoint (telemetry + knowledge reflection)

Your job is to make sure no task ships without contract + specs + review + green tests. You are the last gate before a PR opens.

---

## Preflight

1. Run `git status` and `git diff --stat` to confirm there are changes to finish (uncommitted changes and/or commits ahead of `origin/develop`).
   - If the working tree is clean AND there are no commits ahead: abort with **"Nothing to finish — branch matches develop."**
2. Run `git branch --show-current` to confirm you are on a feature branch (not `main`, not `develop`).
   - If on `main` or `develop`: abort with **"Refusing to finish — not on a feature branch."**
3. Cache the list of changed files (`git diff --name-only origin/develop` for uncommitted + `git diff --name-only origin/develop...HEAD` for committed, merged and deduplicated). You will use it to decide whether e2e tests are needed.
4. Locate the Task Spec: `.claude/specs/<branch-slug>.md` (branch name minus the `feature/`/`fix/`/`refactor/`/`chore/` prefix). Cache its path — Phases 4.6, 5, and 7 use it.
5. Create a task list (TaskCreate) with the six gates so the user sees progress: coverage → spec compliance → contract sync → code review → tests → PR. Mark each `in_progress`/`completed` as you go (TaskUpdate).

---

## Phase 4.5 — Test coverage gate (blocking)

Backend unit tests are **mandatory** in this project (R24; see `.claude/patterns/backend.md` § Tests). Every new or modified `*.use-case.ts`, `*.entity.ts`, `*.dto.ts`, or `*.controller.ts` must have a co-located `*.spec.ts`. This gate runs **before** code review so that the reviewer sees a complete artifact.

1. Run the coverage script (it compares committed AND uncommitted changes against `origin/develop` and exits 2 with a stderr report on failure):

   ```bash
   bash "$CLAUDE_PROJECT_DIR/.claude/hooks/check-test-coverage.sh"
   ```

2. Decision:
   - **Exit 0** → proceed.
   - **Exit 2** → the script printed the missing specs to stderr. Stop and:
     - If you can write the missing specs yourself within the same task scope, invoke the `/test` skill (via `Skill`) with the list of files and let it generate the specs. Then re-run the script. **Never** disable the gate or weaken the spec to make it pass.
     - If the missing test belongs to a different concern (out of scope), use `AskUserQuestion`:
       - "Generate the missing specs now (recommended)"
       - "Skip the gate for these files (must be documented in PR body)"
       - "Hand back to me to handle manually"

   Skipping the gate requires the user to confirm explicitly **and** the PR body must list the skipped files with a reason. The skip is invoked by re-running `/finish-task` with the argument `skip-coverage-gate=<file>` (or `skip-coverage-gate=*` to bypass entirely with a written justification).

---

## Phase 4.6 — Spec compliance gate (blocking)

This project follows Spec-Driven Development (`.claude/patterns/spec.md`): the diff must deliver the Task Spec — all of it, and nothing beyond it.

1. **Read the Task Spec** found in Preflight step 4.
   - If it doesn't exist and the diff is non-trivial (≥3 files or behavior change): that's an `SC-H4`. Write the micro-spec retroactively now (from the conversation history — Goal, Scope, ACs, Decisions log), persist it, and log the violation to `.claude/learning/violations.md`. Trivial diffs proceed without a spec.
2. **Walk the AC ↔ code ↔ test mapping.** For each acceptance criterion, name the implementing change (file) and the test (or the manual verification) that covers it. Produce a compact table in the conversation:

   | AC | Implemented by | Verified by |
   |----|----------------|-------------|

3. **Walk the reverse direction.** Scan the cached diff file list: every behavior change must map back to an AC or to the spec's `Decisions log`. Unmapped surface = scope creep (`SC-H2`); unjustified abstractions = `SC-H3`; drive-by refactors = `SC-M1`; check the diff budget (§8 of the spec).
4. Decision:
   - **All ACs covered, no unmapped surface** → update the spec header to `Status: implemented`, append any final entries to its `Decisions log`, and proceed. (The status flip ships in the Phase 7 commit.)
   - **Gap found** → fix it if it's within scope (implement the missing AC, remove the creep, or move the AC to "Out (deferred)" with the user's awareness via `AskUserQuestion`). Log Critical/High `SC-*` findings to `.claude/learning/violations.md`. Re-walk the mapping after the fix.

---

## Phase 4.7 — BE↔FE contract sync (advisory)

Cross-layer contract drift (rota BE sem consumidor FE, chamada FE sem rota BE correspondente) is one of the most recurring bug classes in `.claude/learning/violations.md` — `X-H1` and `X-C1` show up multiple times per month. This phase runs a heuristic check to surface candidates **before** the reviewer has to find them by hand.

1. Run the script:

   ```bash
   bash "$CLAUDE_PROJECT_DIR/.claude/hooks/check-contract-sync.sh"
   ```

2. Decision:
   - **Exit 0** → proceed.
   - **Exit 2** → the script printed two lists to stderr: **dead-API candidates** (routes BE expõe sem consumidor FE) and **broken FE candidates** (chamadas FE sem rota BE).
3. The script is **advisory by default** (heuristic; false positives possible — webhooks, public surfaces, dynamic URL construction). Use `AskUserQuestion` with these options:
   - **"Fix in this PR"** — invoke the appropriate specialist (`/backend` / `/frontend` / `/fullstack`) to either add the missing consumer, remove the dead route, or fix the broken FE call.
   - **"Document and accept"** — list the accepted candidates in the PR body with one-line justification each (e.g., "GET /api/health is a public liveness probe — no FE consumer expected"). Proceed.
   - **"False positive — refine the script"** — if the same false positive keeps appearing, update `.claude/hooks/check-contract-sync.sh` heuristics rather than papering over it every PR.
4. **Telemetry.** Every accepted dead-API or broken-FE finding (i.e., a real X-H1 the gate caught) is appended to `.claude/learning/violations.md`:

   ```
   | YYYY-MM-DD | X-H1 | check-contract-sync | <verb path — one-sentence context> |
   ```

---

## Phase 5 — Code review (final independent gate)

This is the **third independent eye** on the change. The implementer already ran levels 1 (`code-auditor`) and 2 (`code-reviewer`) inside the BABYSIT loop, and possibly level 3 (`/duck-debug`). Running `/code-review` here means re-running the **semantic reviewer subagent in a fresh isolated context**, with no recall of the implementer's babysit history — pure adversarial review. If the babysit loop did its job, this phase tends to come back clean; if it didn't, this gate catches it.

1. Invoke the `/code-review` skill using the `Skill` tool, passing the Task Spec path in the arguments so the reviewer judges spec compliance (`SC-*`) too.
2. Parse findings by severity: **critical**, **high**, **medium**, **low**, **nitpick**.
3. Decision rules:
   - **No critical/high findings** → proceed to Phase 6.
   - **Critical or high findings that you can safely auto-fix** (typos, obvious bugs, missing null checks, forgotten awaits): apply the fixes, then re-run `/code-review` **once**.
   - **Critical or high findings that require judgment** (architectural changes, security trade-offs, API redesign): present them to the user verbatim and use `AskUserQuestion` to decide:
     - "Auto-fix and continue" — attempt the fix
     - "Address manually then continue" — stop, let the user edit, resume when they say so
     - "Accept and proceed" — document the decision in the PR body later

**Telemetry note.** Every Critical/High finding the reviewer reports — even ones auto-fixed — must be appended to `.claude/learning/violations.md` per `learning/protocol.md` § Pattern-Adoption Telemetry. One line per finding. The reviewer subagent appends these itself; the `/code-review` wrapper verifies the file was updated and patches any misses.

**Why we keep this gate even after BABYSIT.** BABYSIT levels 1 and 2 run inside the implementer's context, which means they share the implementer's mental model — including any blind spots. Phase 5 spawns the reviewer in a brand-new context with no implementation history, giving a genuinely independent third opinion. The protocol cost is cheap (~30s) and the catch is non-trivial.

---

## Phase 6 — Test validation loop (max 3 attempts)

Tests MUST pass before the PR is opened.

1. Decide which test suites to run based on the cached changed-files list:
   - **Always**: `yarn type-check`, `yarn lint`, `yarn test` (backend unit tests) at the monorepo root.
   - **If any file matches `apps/web/**`**: also `yarn test:e2e` inside `apps/web`.
   - **If only `apps/api/**` (or only non-app files) changed**: skip e2e for speed.
2. **Attempt loop** (up to 3 attempts):

   ```
   attempt = 1
   while attempt <= 3:
     run the selected commands in sequence
     if all pass: break
     else:
       - read the failure output
       - identify the failing file(s) and the root cause
       - apply a focused fix (fix the code, NOT the test, unless the test is genuinely outdated)
       - attempt += 1
   ```

3. **On success**: proceed to Phase 7.
4. **On 3 failed attempts**: stop the loop. Use `AskUserQuestion`:
   - "Retry with more context" — share the last failure, continue
   - "Hand back to me" — abort `/finish-task`, let the user debug manually
   - "Skip gate and PR anyway" — requires explicit confirmation, document in PR body

### Rules for the test loop
- **Never** disable or skip a test to make it green. Fix the code.
- **Never** weaken an assertion to make it pass.
- If a test is genuinely outdated (e.g., the spec intentionally changed), update it and mention it in the PR body.
- `yarn lint` auto-fixes the API package broadly. After it runs, check `git status`: if lint auto-fixed files **outside** the task's scope (not in the spec's files plan), revert those hunks (`git checkout -- <file>`) — the PR diff stays scoped to the contract (SC-M1).
- Run the commands via `Bash`. Prefer running `/check` via the `Skill` tool if the changeset is broad — but direct `yarn` commands are fine when you need tight control over the failure loop.

---

## Phase 7 — Commit, push, and PR to develop

This phase **owns** `git commit`, `git push`, and `gh pr create` for the entire lifecycle — no other skill or specialist ever runs them.

1. **Stage and commit.** `git add` the task's files (including the Task Spec with its `implemented` status and any `.claude/learning/` / `.claude/knowledge/` updates). Write a conventional-commit message (`feat:` / `fix:` / `refactor:` / `chore:`) whose body summarizes the change in 2–4 lines. Do not stage unrelated files.
2. **Push** the branch: `git push -u origin <branch>`.
3. **Open the PR** against `develop`:

   ```bash
   gh pr create --base develop --title "<conventional title>" --body "<body>"
   ```

   PR body template:

   ```markdown
   ## Summary
   [2-4 sentences — what changed and why]

   ## Task Spec
   `.claude/specs/<slug>.md` — acceptance criteria:
   - [x] AC-1 — ...
   - [x] AC-2 — ...

   ## Gates
   - Coverage: <ok | bypassed (files + reason)>
   - Spec compliance: <ok | deferred ACs listed>
   - Contract sync: <ok | accepted candidates + justification>
   - Code review: <N findings fixed, M accepted>
   - Tests: type-check ✓ lint ✓ unit ✓ e2e <✓|skipped (backend-only)>

   ## Notes
   [accepted deviations, skipped gates with reasons, follow-ups — omit if empty]
   ```

4. Capture the PR URL. If `gh pr create` fails because the branch already has an open PR, report the existing PR URL and stop.

---

## Phase 8 — Learning checkpoint (non-blocking)

The flow learns from every cycle. Before the final report:

1. **Telemetry completeness.** Verify every Critical/High finding surfaced in Phases 4.5–6 has a line in `.claude/learning/violations.md` (the gates and subagents write their own; patch any misses). Remember: escape any `|` inside the context column.
2. **Knowledge reflection.** If the task was M/L (per `learning/protocol.md` § Step N-1), confirm the implementing specialist wrote its knowledge entry; if it didn't, write the one-line reflection now on its behalf.
3. **Promotion radar.** Scan the ledger for any code with ≥5 entries in the last 30 days. If found, add one line to the final report recommending promotion (hook / BASELINE / knowledge) per `learning/protocol.md` § Recurring-Violations Surfacing — do not apply the promotion yourself.

---

## Final report

Print a concise summary to the user:

```
Task finished.

  Spec:         .claude/specs/<slug>.md → implemented (N/N ACs)
  Coverage:     <ok | bypassed (N files, reason)>
  Code review:  <N findings addressed, M accepted>
  Tests:        type-check ✓  lint ✓  unit ✓  e2e <✓|skipped>
  PR:           <url>
  Learning:     <violations logged: N | promotion candidates: <code> | none>
```

If any phase was skipped with user consent, mention it explicitly (especially the coverage gate).

---

## Error handling

- If a phase fails catastrophically (tool crash, network error, git conflict), stop and report the error to the user. Do **not** continue to the next phase.
- Never leave the working tree in a partially-staged state. If you must abort mid-phase, unstage any changes you added.
