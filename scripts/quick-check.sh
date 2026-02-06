#!/usr/bin/env bash

# Quick validation script for OpenSpace Client
# Runs fast checks only: typecheck, lint, unit tests, and build
# Use this during development for fast feedback

set -e  # Exit on any error

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Emoji support
CHECK="✓"
CROSS="✗"
RUNNING="→"

# Track overall status
ALL_PASSED=true

print_header() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
}

print_step() {
    echo -e "\n${YELLOW}${RUNNING} $1...${NC}"
}

print_success() {
    echo -e "${GREEN}${CHECK} $1${NC}"
}

print_error() {
    echo -e "${RED}${CROSS} $1${NC}"
    ALL_PASSED=false
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Please run this script from the openspace-client directory.${NC}"
    exit 1
fi

print_header "Quick Check - OpenSpace Client"
echo "Running fast validation checks (no E2E tests)..."

START_TIME=$(date +%s)

# TypeScript type checking
print_step "Type checking"
if npm run typecheck > /dev/null 2>&1; then
    print_success "Type checking passed"
else
    print_error "Type checking failed"
    npm run typecheck 2>&1 | tail -20
fi

# Linting
print_step "Linting"
if npm run lint > /dev/null 2>&1; then
    print_success "Linting passed"
else
    print_error "Linting failed"
    echo "Run 'npm run format' to auto-fix formatting issues"
    npm run lint 2>&1 | tail -20
fi

# Unit tests
print_step "Unit tests"
TEST_OUTPUT=$(npm run test -- --run 2>&1)
TEST_EXIT_CODE=$?

if [ $TEST_EXIT_CODE -eq 0 ]; then
    print_success "Unit tests passed"
elif echo "$TEST_OUTPUT" | grep -q "No test files found"; then
    echo -e "${YELLOW}⊘ No unit tests found (expected for now)${NC}"
else
    print_error "Unit tests failed"
    echo "$TEST_OUTPUT" | tail -30
fi

# Build
print_step "Building"
if npm run build > /dev/null 2>&1; then
    print_success "Build passed"
else
    print_error "Build failed"
    npm run build 2>&1 | tail -30
fi

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

# Summary
print_header "Quick Check Summary"
echo "Completed in ${DURATION}s"

if [ "$ALL_PASSED" = true ]; then
    echo -e "${GREEN}${CHECK} All quick checks passed!${NC}"
    echo ""
    echo "Run 'npm run pre-pr' for full validation including E2E tests"
    exit 0
else
    echo -e "${RED}${CROSS} Some checks failed. Please fix the issues above.${NC}"
    exit 1
fi
