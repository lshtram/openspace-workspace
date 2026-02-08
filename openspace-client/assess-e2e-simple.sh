#!/bin/bash

# E2E Test Assessment Script - Simple version
# Runs each test file individually and reports results

set +e  # Don't exit on errors

export PLAYWRIGHT_USE_EXISTING_SERVER=1
TIMEOUT=30000

echo "======================================"
echo "E2E Test Assessment Report"
echo "======================================"
echo ""

test_files=(
  "abort-generation.spec.ts"
  "app.spec.ts"
  "basic-app.spec.ts"
  "debug.spec.ts"
  "files.spec.ts"
  "projects-workspaces.spec.ts"
  "prompt.spec.ts"
  "providers.spec.ts"
  "session-behavior.spec.ts"
  "session-management.spec.ts"
  "settings.spec.ts"
  "simple.spec.ts"
  "status.spec.ts"
  "terminal.spec.ts"
)

passed=0
failed=0
total=14

echo "Running tests..."
echo ""

for test_file in "${test_files[@]}"; do
  printf "%-40s" "$test_file"
  
  output=$(npx playwright test "e2e/$test_file" --config=e2e/playwright.config.ts --timeout=$TIMEOUT 2>&1)
  exit_code=$?
  
  if [ $exit_code -eq 0 ]; then
    count=$(echo "$output" | grep -oE "[0-9]+ passed" | head -1 | grep -oE "[0-9]+")
    echo "✓ PASS ($count tests)"
    ((passed++))
  else
    count=$(echo "$output" | grep -oE "[0-9]+ failed" | head -1 | grep -oE "[0-9]+")
    if [ -z "$count" ]; then
      count="?"
    fi
    echo "✗ FAIL ($count tests)"
    ((failed++))
    
    # Save detailed errors for later
    echo "$output" > "e2e/test-results/error-$test_file.log" 2>/dev/null
  fi
done

echo ""
echo "======================================"
echo "Summary"
echo "======================================"
echo "Total: $total"
echo "Passed: $passed"
echo "Failed: $failed"
echo ""

success_rate=$(awk "BEGIN {printf \"%.1f\", ($passed/$total)*100}")
echo "Success rate: ${success_rate}%"
echo ""

if [ $failed -gt 0 ]; then
  echo "Failed tests:"
  for test_file in "${test_files[@]}"; do
    if [ -f "e2e/test-results/error-$test_file.log" ]; then
      echo "  - $test_file"
    fi
  done
fi

echo ""
