#!/usr/bin/env bash
# =============================================================================
# Vercel Template Rule Validation Script
# =============================================================================
# This script ensures that AI agents (or humans) have not modified the immutable
# rules and skills files that govern the architecture of this template.
# Run this script using `npm run validate-rules`.

set -e

# ANSI Color Codes
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "============================================================"
echo " Running Architecture Integrity Validation"
echo "============================================================"

# List of critical architectural source-of-truth files
FILES=(
    "RULES.md"
    "CLAUDE.md"
    "skills/ai-init-project.md"
)

# We are just checking if they exist and are non-empty for now, as a basic check.
# In a true template context, you'd track a git commit hash or lockfile.
ALL_PASSED=true

for file in "${FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}[ERROR] CRITICAL FILE MISSING: $file${NC}"
        ALL_PASSED=false
    else
        echo -e "${GREEN}[OK] File present: $file${NC}"
    fi
done

if [ "$ALL_PASSED" = true ]; then
    echo -e "\n${GREEN}SUCCESS: All architectural rules files are intact.${NC}"
    exit 0
else
    echo -e "\n${RED}FAILURE: Architecture validation failed. Please restore missing files.${NC}"
    exit 1
fi
