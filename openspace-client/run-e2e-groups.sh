#!/bin/bash

# Run e2e tests in small groups to identify which ones work
# Usage: ./run-e2e-groups.sh

set -e

export PLAYWRIGHT_USE_EXISTING_SERVER=1

echo "====== Group 1: Simple Tests ======"
npx playwright test simple.spec.ts debug.spec.ts --config=e2e/playwright.config.ts

echo ""
echo "====== Group 2: Basic App Tests ======"
npx playwright test e2e/app.spec.ts --config=e2e/playwright.config.ts || echo "App tests failed"

echo ""
echo "====== Group 3: Prompt Tests ======"
npx playwright test e2e/prompt.spec.ts --config=e2e/playwright.config.ts || echo "Prompt tests failed"

echo ""
echo "====== Group 4: Terminal Tests ======"
npx playwright test e2e/terminal.spec.ts --config=e2e/playwright.config.ts || echo "Terminal tests failed"

echo ""
echo "====== Group 5: Files Tests ======"
npx playwright test e2e/files.spec.ts --config=e2e/playwright.config.ts || echo "Files tests failed"

echo ""
echo "====== Group 6: Settings Tests ======"
npx playwright test e2e/settings.spec.ts --config=e2e/playwright.config.ts || echo "Settings tests failed"

echo ""
echo "====== Group 7: Status Tests ======"
npx playwright test e2e/status.spec.ts --config=e2e/playwright.config.ts || echo "Status tests failed"

echo ""
echo "====== Group 8: Providers Tests ======"
npx playwright test e2e/providers.spec.ts --config=e2e/playwright.config.ts || echo "Providers tests failed"

echo ""
echo "====== All Groups Complete ======"
