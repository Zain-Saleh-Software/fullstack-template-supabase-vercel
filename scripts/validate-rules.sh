#!/usr/bin/env bash
# =============================================================================
# validate-rules.sh — Rule Enforcement Validator
# =============================================================================
# IMMUTABLE: This file MUST NEVER be modified.
# 
# This script validates that NO rule/skill/policy files have been modified,
# deleted, or renamed. It is designed to be run by:
#   - AI agents (before and after every change)
#   - Pre-commit hooks
#   - CI/CD pipelines
#
# Exit codes:
#   0 = All rules intact
#   1 = Rule violation detected
# =============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color
PASS=0
FAIL=0

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║   RULES VALIDATOR — Checking template integrity             ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# ─── Configuration ──────────────────────────────────────────────────────────
# List of files and directories that MUST NEVER be modified/deleted/renamed
IMMUTABLE_PATHS=(
    "skills/"
    "RULES.md"
    "CLAUDE.md"
    "scripts/validate-rules.sh"
)

# Expected skill files (checks none were deleted)
EXPECTED_SKILLS=(
    "skills/ai-collaboration-patterns.md"
    "skills/ai-init-project.md"
    "skills/crm-database-patterns.md"
    "skills/configuration-patterns.md"
    "skills/deployment-patterns.md"
    "skills/error-handling-patterns.md"
    "skills/frontend-patterns.md"
    "skills/git-workflow-patterns.md"
    "skills/middleware-patterns.md"
    "skills/mvp-architecture.md"
    "skills/observability-patterns.md"
    "skills/orm-patterns.md"
    "skills/performance-patterns.md"
    "skills/preloading-patterns.md"
    "skills/rbac-patterns.md"
    "skills/security-patterns.md"
    "skills/testing-patterns.md"
)

# ─── Helper Functions ───────────────────────────────────────────────────────

check() {
    local desc="$1"
    local result="$2"
    if [ "$result" -eq 0 ]; then
        echo -e "  ${GREEN}✓${NC} $desc"
        PASS=$((PASS + 1))
    else
        echo -e "  ${RED}✗${NC} $desc"
        FAIL=$((FAIL + 1))
    fi
}

# ─── Checks ─────────────────────────────────────────────────────────────────

# Check 1: All expected skill files exist
echo "→ Checking skill file integrity..."
ALL_SKILLS_EXIST=0
for skill in "${EXPECTED_SKILLS[@]}"; do
    if [ ! -f "$skill" ]; then
        echo -e "  ${RED}  MISSING:${NC} $skill"
        ALL_SKILLS_EXIST=1
    fi
done
check "All expected skill files exist" "$ALL_SKILLS_EXIST"

# Check 2: No extra files in skills/ directory
echo "→ Checking for unexpected files in skills/..."
UNEXPECTED=0
if [ -d "skills/" ]; then
    for f in skills/*.md; do
        basename=$(basename "$f")
        found=0
        for skill in "${EXPECTED_SKILLS[@]}"; do
            if [ "$f" = "$skill" ]; then
                found=1
                break
            fi
        done
        if [ "$found" -eq 0 ]; then
            echo -e "  ${RED}  UNEXPECTED:${NC} $f"
            UNEXPECTED=1
        fi
    done
fi
check "No unexpected files in skills/" "$UNEXPECTED"

# Check 3: Git-based immutability check (if in a git repo)
echo "→ Checking immutable paths for modifications..."
if git rev-parse --git-dir > /dev/null 2>&1; then
    IMMUTABLE_VIOLATED=0
    for path in "${IMMUTABLE_PATHS[@]}"; do
        # Check working tree changes
        if git diff --name-only HEAD 2>/dev/null | grep -q "^${path}" || \
           git diff --cached --name-only 2>/dev/null | grep -q "^${path}"; then
            echo -e "  ${RED}  MODIFIED:${NC} $path has been changed. REVERT IMMEDIATELY."
            IMMUTABLE_VIOLATED=1
        fi
    done
    check "No immutable paths modified" "$IMMUTABLE_VIOLATED"
else
    echo -e "  ${YELLOW}  SKIP:${NC} Not a git repository, skipping git check"
    PASS=$((PASS + 1))
fi

# Check 4: RULES.md still references all expected skills
echo "→ Checking RULES.md references all skills..."
RULES_MISSING=0
for skill in "${EXPECTED_SKILLS[@]}"; do
    basename=$(basename "$skill")
    if ! grep -q "$basename" RULES.md 2>/dev/null; then
        echo -e "  ${RED}  MISSING REF:${NC} RULES.md does not reference $basename"
        RULES_MISSING=1
    fi
done
check "RULES.md references all skills" "$RULES_MISSING"

# ─── Summary ─────────────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
if [ "$FAIL" -eq 0 ]; then
    echo -e "║   ${GREEN}ALL CHECKS PASSED${NC}  ($PASS/$PASS)                     ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    exit 0
else
    echo -e "║   ${RED}${FAIL} VIOLATION(S) DETECTED${NC}  ($PASS passed, $FAIL failed)       ║"
    echo "║   REVERT all changes to immutable files immediately.    ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    exit 1
fi
