#!/bin/bash

# Pre-commit hook to prevent committing sensitive information
# To install: copy this file to .git/hooks/pre-commit and make it executable
# chmod +x .git/hooks/pre-commit

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo "🔍 Checking for sensitive information..."

# Check for potential secrets in staged files
SECRET_PATTERNS="(password|secret|key|token|api_key|private_key|DATABASE_URL|JWT_SECRET|SMTP_PASS|PINATA_|VERCEL_|npg_)"

if git diff --cached --name-only | xargs grep -l -i -E "$SECRET_PATTERNS" 2>/dev/null; then
    echo -e "${RED}❌ COMMIT BLOCKED: Potential secrets detected in staged files!${NC}"
    echo -e "${YELLOW}Files with potential secrets:${NC}"
    git diff --cached --name-only | xargs grep -l -i -E "$SECRET_PATTERNS" 2>/dev/null
    echo ""
    echo -e "${YELLOW}Lines containing potential secrets:${NC}"
    git diff --cached --name-only | xargs grep -n -i -E "$SECRET_PATTERNS" 2>/dev/null | head -10
    echo ""
    echo -e "${YELLOW}Please remove secrets and use environment variables instead.${NC}"
    exit 1
fi

# Check for .env files being committed (except .env.example)
ENV_FILES=$(git diff --cached --name-only | grep -E "\.env$|\.env\.(local|production|development|test|vercel)$" | grep -v "\.env\.example$")
if [ ! -z "$ENV_FILES" ]; then
    echo -e "${RED}❌ COMMIT BLOCKED: .env files detected!${NC}"
    echo -e "${YELLOW}Detected .env files:${NC}"
    echo "$ENV_FILES"
    echo ""
    echo -e "${YELLOW}Please remove .env files from git and use .env.example instead.${NC}"
    exit 1
fi

# Check for API key files
API_FILES=$(git diff --cached --name-only | grep -E "(api|secret|key|token|password).*\.txt$|.*_(api|secret|key|token|password)\.|pinata_api\.txt")
if [ ! -z "$API_FILES" ]; then
    echo -e "${RED}❌ COMMIT BLOCKED: API key files detected!${NC}"
    echo -e "${YELLOW}Detected files:${NC}"
    echo "$API_FILES"
    echo ""
    echo -e "${YELLOW}Please remove these files and use environment variables instead.${NC}"
    exit 1
fi

# Check for hardcoded tokens in specific patterns
TOKEN_PATTERNS="(wtFrnUJyqeM3EOEGZ4G6mE1t|npg_El3Yfu7IxFDa|Do0109Ro1986Sh|ea48b87c6a6b46665388)"
if git diff --cached | grep -E "$TOKEN_PATTERNS" >/dev/null 2>&1; then
    echo -e "${RED}❌ COMMIT BLOCKED: Known sensitive tokens detected!${NC}"
    echo -e "${YELLOW}Found hardcoded tokens that should be in environment variables.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ No sensitive information detected. Commit allowed.${NC}"
exit 0