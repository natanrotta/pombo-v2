#!/usr/bin/env bash
# PostToolUse hook for Edit/Write on Playwright e2e files.
# Greps for the E-* anti-patterns in patterns/e2e.md.
# Advisory only (stderr); never blocking.

set -uo pipefail

payload="$(cat || true)"
[ -z "$payload" ] && exit 0

file=""
if command -v jq >/dev/null 2>&1; then
  file="$(printf '%s' "$payload" | jq -r '.tool_input.file_path // empty' 2>/dev/null || true)"
fi
if [ -z "$file" ]; then
  file="$(printf '%s' "$payload" | sed -n 's/.*"file_path"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -n1)"
fi

# Only e2e files: apps/web/e2e/**/*.ts (specs, pages, fixtures)
case "$file" in
  *apps/web/e2e/*.ts) ;;
  *) exit 0 ;;
esac

# Skip the auth setup file — it owns the one legitimate manual login
case "$file" in
  *apps/web/e2e/global.setup.ts) exit 0 ;;
esac

[ -f "$file" ] || exit 0

warn() {
  printf '⚠️  [e2e-hook] %s\n' "$1" >&2
}

# E-C1: CSS class / xpath / generated-id selectors
if grep -nE 'page\.locator\(["'\''][.#]|page\.\$x\(|\[class\*=' "$file" >/dev/null; then
  lines="$(grep -nE 'page\.locator\(["'\''][.#]|page\.\$x\(|\[class\*=' "$file" | head -3)"
  warn "E-C1: CSS class / xpath / [class*=] selector detected — use getByRole / getByLabel / getByText. Lines: $lines"
fi

# E-C2: manual login inside a spec (any e2e file that isn't global.setup.ts)
# Signature: either (a) a locator that targets sign-in/password fields, or
# (b) a `page.goto("/sign-in")` / `/login` navigation. The latter is the
# strongest single tell — an authenticated spec never navigates there.
# global.setup.ts is excluded by the early `case` filter above.
ec2_signal=""
if grep -nEi 'page\.goto\(["'\''][./]*(sign-?in|login)' "$file" >/dev/null; then
  ec2_signal="goto-signin"
elif grep -nEi 'name: /sign in\|entrar/|name: /password\|senha/|name: /entrar\|sign in/|name: /senha\|password/' "$file" >/dev/null; then
  ec2_signal="login-locator"
fi
if [ -n "$ec2_signal" ]; then
  case "$file" in
    *apps/web/e2e/tests/*signin*|*apps/web/e2e/tests/*login*|*apps/web/e2e/tests/*auth/*) ;;  # auth-flow specs may legitimately log in
    *)
      lines="$(grep -nEi 'page\.goto\(["'\''][./]*(sign-?in|login)|name: /sign in\|entrar/|name: /password\|senha/' "$file" | head -3)"
      warn "E-C2: looks like a manual login outside global.setup.ts (signal: ${ec2_signal}) — rely on the storageState already injected by the chromium project. Lines: $lines"
      ;;
  esac
fi

# E-C3: waitForTimeout outside the 500ms-debounce convention
if grep -nE 'waitForTimeout\(' "$file" >/dev/null; then
  bad_lines="$(grep -nE 'waitForTimeout\(' "$file" | grep -vE 'waitForTimeout\(500\b|waitForTimeout\(300\b' || true)"
  if [ -n "$bad_lines" ]; then
    warn "E-C3: waitForTimeout with non-debounce value — only 500ms (search debounce, see patterns/e2e.md) or 300ms (animation, document why) are allowed. Lines: $(printf '%s' "$bad_lines" | head -3)"
  fi
fi

# E-C4: hardcoded credentials / secrets in fixtures or specs
if grep -nE '(password|senha|api[_-]?key|secret|token)["'\'']?\s*[:=]\s*["'\''][A-Za-z0-9!@#$%^&*\-_=+]{8,}' "$file" >/dev/null; then
  # Allow the documented test password and obvious placeholders
  unsafe="$(grep -nE '(password|senha|api[_-]?key|secret|token)["'\'']?\s*[:=]\s*["'\''][A-Za-z0-9!@#$%^&*\-_=+]{8,}' "$file" | grep -vE '123456|password123|test@|boilerplate\.dev|example' || true)"
  if [ -n "$unsafe" ]; then
    warn "E-C4: possible hardcoded credential — verify it isn't a real secret. Lines: $(printf '%s' "$unsafe" | head -3)"
  fi
fi

# E-H1: single-language literal in a Playwright locator call (getByText / getByRole / getByLabel / getByPlaceholder)
# Heuristic: literal string (3+ letters) inside a *locator call* — NOT inside arbitrary object literals
# like fillForm({ name: "test data" }), where the string is fixture data, not an assertion.
if grep -nE 'getByText\(["'\''][A-Za-zÀ-ÿ ]{3,}["'\'']\s*[),]|getByRole\([^)]+,\s*\{\s*name:\s*["'\''][A-Za-zÀ-ÿ ]{3,}["'\'']|getByLabel\(["'\''][A-Za-zÀ-ÿ ]{3,}["'\'']|getByPlaceholder\(["'\''][A-Za-zÀ-ÿ ]{3,}["'\'']' "$file" >/dev/null; then
  lines="$(grep -nE 'getByText\(["'\''][A-Za-zÀ-ÿ ]{3,}["'\'']\s*[),]|getByRole\([^)]+,\s*\{\s*name:\s*["'\''][A-Za-zÀ-ÿ ]{3,}["'\'']|getByLabel\(["'\''][A-Za-zÀ-ÿ ]{3,}["'\'']|getByPlaceholder\(["'\''][A-Za-zÀ-ÿ ]{3,}["'\'']' "$file" | head -3)"
  warn "E-H1: literal text in a Playwright locator — use bilingual regex /pt|en/i (e.g. getByText(/criado|created/i)). Lines: $lines"
fi

# E-H2: nth/first/last used to fix locator ambiguity
# Skip POM fields that legitimately address a deliberate position (rare). Just count occurrences.
nth_count="$(grep -cE '\.(first|last|nth)\(' "$file" 2>/dev/null || echo 0)"
# Specs should be much stricter than POMs. POMs legitimately use .first() /
# .last() for canonical card patterns (e.g. `card.getByRole("button").last()`
# for the menu trigger); 5+ in a spec is almost always a sign of fragile
# locators being patched with indexing.
case "$file" in
  *apps/web/e2e/tests/*) e_h2_limit=2; e_h2_kind="specs" ;;
  *apps/web/e2e/pages/*) e_h2_limit=6; e_h2_kind="POMs" ;;
  *) e_h2_limit=4; e_h2_kind="fixtures" ;;
esac
if [ "${nth_count:-0}" -gt "$e_h2_limit" ] 2>/dev/null; then
  warn "E-H2: ${nth_count} usages of .first()/.last()/.nth() in one file (limit ${e_h2_limit} for ${e_h2_kind}) — refine locators with .filter({ has: ... }) instead of indexing."
fi

# E-H6: spec or POM importing from apps/web/src/**
if grep -nE 'from ["'\''](\.\./)+src/|from ["'\'']@/' "$file" >/dev/null; then
  case "$file" in
    *apps/web/e2e/fixtures/*.mocks.ts) ;;  # mocks may type-only import domain entities
    *)
      lines="$(grep -nE 'from ["'\''](\.\./)+src/|from ["'\'']@/' "$file" | head -3)"
      warn "E-H6: importing from apps/web/src/** in an e2e file — only type-only imports inside fixtures/*.mocks.ts are allowed. Lines: $lines"
      ;;
  esac
fi

# E-M3: networkidle reminder — informational only, one warning per file.
# networkidle is tolerated as legacy in this project (TanStack infinite-scroll races);
# we just remind the agent that new waits should prefer expect(locator).toBeVisible().
networkidle_count="$(grep -cE 'waitForLoadState\(["'\'']networkidle' "$file" 2>/dev/null || echo 0)"
if [ "${networkidle_count:-0}" -ge 6 ] 2>/dev/null; then
  warn "E-M3 reminder: ${networkidle_count} networkidle waits in this file — prefer expect(locator).toBeVisible({ timeout }) for new ones, and comment why if you keep an existing one."
fi

# E-M4: data-testid usage — flag for human review (often a code smell)
if grep -nE 'getByTestId\(' "$file" >/dev/null; then
  lines="$(grep -nE 'getByTestId\(' "$file" | head -3)"
  warn "E-M4: getByTestId detected — verify role/label/text were tried first. If a testid is necessary, document why in the POM. Lines: $lines"
fi

exit 0
