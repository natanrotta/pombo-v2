#!/usr/bin/env bash
# Test coverage gate.
#
# Compares the current branch against origin/develop and refuses to
# proceed if a new (added/modified) backend source file lacks its
# co-located *.spec.ts.
#
# Designed to be invoked from /finish-task (or as a Stop hook).
# Exit 2 = block. Exit 0 = pass. Stderr is shown to the agent.
#
# Files that REQUIRE specs:
#   *.use-case.ts       → *.use-case.spec.ts
#   *.entity.ts         → *.entity.spec.ts
#   *.dto.ts            → *.dto.spec.ts
#   *.controller.ts     → *.controller.spec.ts
#
# Files in src/test/ (mocks) and any */test/ (factories) + *.factory.ts/*.mock.ts are exempt.

set -uo pipefail

# Resolve repo root (worktree)
root="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [ -z "$root" ]; then
  echo "[coverage-gate] Not inside a git repo — skipping." >&2
  exit 0
fi

cd "$root"

# Make sure we have origin/develop locally
git fetch origin develop --quiet 2>/dev/null || true

# Compute changed backend source files vs develop.
# Union of committed (merge-base...HEAD) AND working-tree changes, so the gate
# works mid-task (before /finish-task commits) — uncommitted use cases without
# specs used to slip through the three-dot-only diff.
changed_committed="$(git diff --name-only --diff-filter=AM origin/develop...HEAD -- 'apps/api/src/**.ts' 2>/dev/null || true)"
changed_working="$(git diff --name-only --diff-filter=AM origin/develop -- 'apps/api/src/**.ts' 2>/dev/null || true)"
changed="$(printf '%s\n%s\n' "$changed_committed" "$changed_working" | sort -u | sed '/^$/d')"

if [ -z "$changed" ]; then
  exit 0
fi

missing=()

while IFS= read -r f; do
  [ -z "$f" ] && continue

  # Skip test files, factories, mocks
  case "$f" in
    *.spec.ts|*.test.ts) continue ;;
    */test/*|*.factory.ts|*.mock.ts) continue ;;
  esac

  # Determine expected spec
  spec=""
  case "$f" in
    *.use-case.ts)   spec="${f%.use-case.ts}.use-case.spec.ts" ;;
    *.entity.ts)     spec="${f%.entity.ts}.entity.spec.ts" ;;
    *.dto.ts)        spec="${f%.dto.ts}.dto.spec.ts" ;;
    *.controller.ts) spec="${f%.controller.ts}.controller.spec.ts" ;;
    *) continue ;;
  esac

  if [ ! -f "$spec" ]; then
    missing+=("$f → expected: $spec")
  fi
done <<< "$changed"

if [ "${#missing[@]}" -gt 0 ]; then
  {
    echo ""
    echo "❌ Test coverage gate failed."
    echo ""
    echo "The following backend files were added/modified but have no co-located *.spec.ts:"
    echo ""
    for entry in "${missing[@]}"; do
      echo "  - $entry"
    done
    echo ""
    echo "Backend unit tests are mandatory in this project (see CLAUDE.md and patterns/backend.md § Tests)."
    echo "Create the specs (use the /test skill) and re-run /finish-task."
    echo ""
    echo "If a test is genuinely not required for a specific file (rare), invoke /finish-task with"
    echo "argument 'skip-coverage-gate=<file>' and document the reason in the PR body."
  } >&2
  exit 2
fi

exit 0
