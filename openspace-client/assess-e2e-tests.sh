#!/bin/bash

# E2E Test Assessment Script
# Runs each test file individually and collects results
# Usage: ./assess-e2e-tests.sh

set +e  # Don't exit on errors

export PLAYWRIGHT_USE_EXISTING_SERVER=1
TIMEOUT=30000  # 30 seconds per test file

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "======================================"
echo "E2E Test Assessment Report"
echo "======================================"
echo ""
echo "Testing each spec file individually..."
echo "Timeout per file: ${TIMEOUT}ms"
echo ""

# Array to store results
declare -A results
declare -A test_counts
declare -A errors

# List of all test files
test_files=(
  "e2e/abort-generation.spec.ts"
  "e2e/app.spec.ts"
  "e2e/basic-app.spec.ts"
  "e2e/debug.spec.ts"
  "e2e/files.spec.ts"
  "e2e/projects-workspaces.spec.ts"
  "e2e/prompt.spec.ts"
  "e2e/providers.spec.ts"
  "e2e/session-behavior.spec.ts"
  "e2e/session-management.spec.ts"
  "e2e/settings.spec.ts"
  "e2e/simple.spec.ts"
  "e2e/status.spec.ts"
  "e2e/terminal.spec.ts"
)

total_files=${#test_files[@]}
passed_files=0
failed_files=0

for test_file in "${test_files[@]}"; do
  file_name=$(basename "$test_file")
  echo -n "Testing ${file_name}... "
  
  # Run the test and capture output
  output=$(npx playwright test "$test_file" --config=e2e/playwright.config.ts --timeout=$TIMEOUT 2>&1)
  exit_code=$?
  
  # Parse the output for test counts
  if echo "$output" | grep -q "passed"; then
    count=$(echo "$output" | grep -oE "[0-9]+ passed" | head -1)
    test_counts[$file_name]=$count
  else
    test_counts[$file_name]="0 passed"
  fi
  
  # Store result
  if [ $exit_code -eq 0 ]; then
    results[$file_name]="PASS"
    echo -e "${GREEN}✓ PASS${NC} (${test_counts[$file_name]})"
    ((passed_files++))
  else
    results[$file_name]="FAIL"
    # Extract error summary
    error_summary=$(echo "$output" | grep -A 2 "Error:" | head -3 | tr '\n' ' ')
    errors[$file_name]=$error_summary
    echo -e "${RED}✗ FAIL${NC} (${test_counts[$file_name]})"
  fi
done

echo ""
echo "======================================"
echo "Summary"
echo "======================================"
echo ""
echo "Total test files: $total_files"
echo -e "${GREEN}Passed: $passed_files${NC}"
echo -e "${RED}Failed: $failed_files${NC}"
echo ""

# Success rate
success_rate=$(awk "BEGIN {printf \"%.1f\", ($passed_files/$total_files)*100}")
echo "Success rate: ${success_rate}%"
echo ""

if [ $failed_files -gt 0 ]; then
  echo "======================================"
  echo "Failed Tests Details"
  echo "======================================"
  echo ""
  for test_file in "${test_files[@]}"; do
    file_name=$(basename "$test_file")
    if [ "${results[$file_name]}" = "FAIL" ]; then
      echo -e "${RED}✗ ${file_name}${NC}"
      echo "   ${errors[$file_name]}" | head -c 200
      echo ""
    fi
  done
fi

echo ""
echo "======================================"
echo "Recommendations"
echo "======================================"
echo ""

if [ $passed_files -eq $total_files ]; then
  echo -e "${GREEN}🎉 All tests passing! No action needed.${NC}"
elif [ $passed_files -gt $((total_files / 2)) ]; then
  echo -e "${YELLOW}More than half of tests are passing.${NC}"
  echo "Focus on fixing the failed tests."
else
  echo -e "${RED}Many tests are failing.${NC}"
  echo "Consider:"
  echo "1. Check if servers are running (Vite on 5173, OpenCode on 3000)"
  echo "2. Review fixture setup and mocking strategy"
  echo "3. Update selectors to match actual DOM"
fi

echo ""
echo "To see detailed output for a specific test:"
echo "  PLAYWRIGHT_USE_EXISTING_SERVER=1 npx playwright test <test-file> --config=e2e/playwright.config.ts"
echo ""
