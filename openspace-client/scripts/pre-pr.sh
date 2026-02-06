#!/usr/bin/env bash

# Pre-PR Validation Script for OpenSpace Client
# This script runs all tests, linting, type checking, and builds to ensure
# everything passes before creating a pull request.

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

# Helper functions
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

print_skip() {
    echo -e "${YELLOW}⊘ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Please run this script from the openspace-client directory.${NC}"
    exit 1
fi

# Check if this is the openspace-client project
if ! grep -q '"name": "openspace-client"' package.json; then
    echo -e "${RED}Error: This doesn't appear to be the openspace-client project.${NC}"
    exit 1
fi

print_header "Pre-PR Validation for OpenSpace Client"
echo "Starting comprehensive validation checks..."
echo "This will run: type checking, linting, unit tests, E2E tests, and build"

# Step 1: Check for uncommitted changes
print_step "Checking git status"
if [ -d ".git" ]; then
    if [[ -n $(git status -s) ]]; then
        echo -e "${YELLOW}Warning: You have uncommitted changes:${NC}"
        git status -s
        echo ""
        read -p "Continue anyway? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Aborting."
            exit 1
        fi
    else
        print_success "Working directory is clean"
    fi
else
    print_skip "Not a git repository, skipping git status check"
fi

# Step 2: Install dependencies
print_step "Checking dependencies"
if [ ! -d "node_modules" ]; then
    echo "node_modules not found. Installing dependencies..."
    npm install
    print_success "Dependencies installed"
else
    print_success "Dependencies are installed"
fi

# Step 3: TypeScript type checking
print_step "Running TypeScript type checking"
if npm run typecheck 2>&1 | tee /tmp/typecheck.log; then
    print_success "Type checking passed"
else
    print_error "Type checking failed"
    echo "See output above for details"
fi

# Step 4: Linting
print_step "Running ESLint"
if npm run lint 2>&1 | tee /tmp/lint.log; then
    print_success "Linting passed"
else
    print_error "Linting failed"
    echo "See output above for details"
    echo "Tip: Run 'npm run format' to auto-fix formatting issues"
fi

# Step 5: Unit tests
print_step "Running unit tests (Vitest)"
TEST_OUTPUT=$(npm run test -- --run 2>&1 | tee /tmp/unit-tests.log)
TEST_EXIT_CODE=$?

if [ $TEST_EXIT_CODE -eq 0 ]; then
    print_success "Unit tests passed"
elif grep -q "No test files found" /tmp/unit-tests.log; then
    print_skip "No unit tests found (this is expected for now)"
else
    print_error "Unit tests failed"
    echo "See output above for details"
fi

# Step 6: Build
print_step "Running production build"
if npm run build 2>&1 | tee /tmp/build.log; then
    print_success "Build passed"
    # Show build size
    if [ -d "dist" ]; then
        echo "Build output size:"
        du -sh dist
    fi
else
    print_error "Build failed"
    echo "See output above for details"
fi

# Step 7: E2E tests (optional, can be slow)
print_header "E2E Tests (Playwright)"
echo ""
read -p "Run E2E tests? This can take several minutes. (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_step "Running E2E tests (Playwright)"
    
    # Check if playwright browsers are installed
    if ! npx playwright --version &> /dev/null; then
        echo "Playwright not found. Installing..."
        npx playwright install
    fi
    
    # Check if browsers are installed
    if ! npx playwright install --dry-run chromium &> /dev/null; then
        echo "Playwright browsers not installed. Installing chromium..."
        npx playwright install chromium
    fi
    
    # Run E2E tests
    if npx playwright test 2>&1 | tee /tmp/e2e-tests.log; then
        print_success "E2E tests passed"
    else
        print_error "E2E tests failed"
        echo "See output above for details"
        echo ""
        echo "Tip: Run 'npm run test:e2e' to run E2E tests with UI mode for debugging"
        echo "Or check the HTML report with: npx playwright show-report"
    fi
else
    print_skip "E2E tests skipped by user"
    echo "Note: E2E tests should pass before merging to main"
fi

# Summary
print_header "Validation Summary"

if [ "$ALL_PASSED" = true ]; then
    echo -e "${GREEN}${CHECK} All checks passed! You're ready to create a PR.${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Review your changes: git diff"
    echo "  2. Commit your changes: git add . && git commit -m 'your message'"
    echo "  3. Push to remote: git push origin your-branch-name"
    echo "  4. Create a pull request on GitHub"
    exit 0
else
    echo -e "${RED}${CROSS} Some checks failed. Please fix the issues above before creating a PR.${NC}"
    echo ""
    echo "Common fixes:"
    echo "  - Type errors: Review and fix TypeScript errors"
    echo "  - Lint errors: Run 'npm run format' to auto-fix formatting"
    echo "  - Test failures: Run 'npm run test' or 'npm run test:ui' to debug"
    echo "  - Build errors: Check for missing dependencies or syntax errors"
    echo ""
    echo "Logs saved to:"
    echo "  - /tmp/typecheck.log"
    echo "  - /tmp/lint.log"
    echo "  - /tmp/unit-tests.log"
    echo "  - /tmp/build.log"
    echo "  - /tmp/e2e-tests.log"
    exit 1
fi
