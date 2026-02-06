# Validation Scripts Quick Reference

## 📋 What Gets Checked?

### `npm run check` (Quick - 30-60s)
```
┌─────────────────────────────────────┐
│  Quick Check (Development)          │
├─────────────────────────────────────┤
│  ✓ TypeScript Type Checking         │
│  ✓ ESLint Linting                   │
│  ✓ Unit Tests (Vitest)              │
│  ✓ Production Build                 │
└─────────────────────────────────────┘
```

### `npm run pre-pr` (Full - 5-10min)
```
┌─────────────────────────────────────┐
│  Pre-PR Validation (Comprehensive)  │
├─────────────────────────────────────┤
│  ✓ Git Status Check                 │
│  ✓ Dependencies Check               │
│  ✓ TypeScript Type Checking         │
│  ✓ ESLint Linting                   │
│  ✓ Unit Tests (Vitest)              │
│  ✓ Production Build                 │
│  ✓ E2E Tests (Playwright) [optional]│
└─────────────────────────────────────┘
```

## 🎯 When to Use

| Scenario | Command | Why |
|----------|---------|-----|
| After changing code | `npm run check` | Fast feedback loop |
| Before committing | `npm run check` | Catch issues before commit |
| After pulling changes | `npm run check` | Verify everything still works |
| Before creating PR | `npm run pre-pr` | Full validation with E2E |
| In CI/CD pipeline | `npm run pre-pr` | Comprehensive checks |

## 📊 Comparison

| Feature | `check` | `pre-pr` |
|---------|---------|----------|
| Type checking | ✅ | ✅ |
| Linting | ✅ | ✅ |
| Unit tests | ✅ | ✅ |
| Build | ✅ | ✅ |
| E2E tests | ❌ | ✅ (optional) |
| Git status | ❌ | ✅ |
| Time | ~30-60s | ~5-10min |
| Use case | Development | Pre-PR/CI |

## 🔧 Common Workflows

### Daily Development
```bash
# 1. Make changes to code
vim src/components/MyComponent.tsx

# 2. Run quick check
npm run check

# 3. Fix any issues
npm run format      # Auto-fix formatting
npm run typecheck   # Focus on type errors

# 4. Repeat until all checks pass
```

### Pre-Commit
```bash
# 1. Check what changed
git status

# 2. Run quick validation
npm run check

# 3. Commit if all passes
git add .
git commit -m "feat: add new feature"
```

### Pre-Pull Request
```bash
# 1. Ensure all changes are committed
git status

# 2. Run full validation
npm run pre-pr

# 3. Answer 'y' to run E2E tests (important!)

# 4. If all passes, push and create PR
git push origin your-branch
```

## 🚨 Troubleshooting

### Script Permission Denied
```bash
chmod +x scripts/*.sh
```

### Type Checking Fails
```bash
# Run typecheck to see errors
npm run typecheck

# Fix errors in your IDE
# Then run check again
npm run check
```

### Linting Fails
```bash
# Try auto-fixing first
npm run format

# Check remaining issues
npm run lint

# Fix manually in your IDE
```

### Unit Tests Fail
```bash
# Run tests with UI for debugging
npm run test:ui

# Or run specific test file
npm run test -- src/components/MyComponent.test.tsx
```

### E2E Tests Fail
```bash
# Run with UI mode
npm run test:e2e:ui

# Or run in headed mode to see browser
npx playwright test --headed

# Check specific test
npx playwright test e2e/prompt.spec.ts
```

### Build Fails
```bash
# Check build output
npm run build

# Look for:
# - Type errors
# - Missing dependencies
# - Syntax errors
```

## 💡 Tips

1. **Run `check` frequently** - Don't wait until the end to validate
2. **Fix issues immediately** - Easier to fix while context is fresh
3. **Use watch mode during development** - `npm run test` for auto-rerun
4. **Skip E2E in pre-pr during development** - Save time, run before final PR
5. **Check logs in `/tmp/`** - Detailed error information saved there

## 📝 Exit Codes

Both scripts return standard exit codes:
- `0` = All checks passed ✅
- `1` = One or more checks failed ❌

Perfect for scripting and CI/CD:
```bash
npm run check && git commit -m "feat: something" || echo "Fix issues first!"
```

## 🔗 Related Files

- [scripts/README.md](README.md) - Detailed script documentation
- [../README.md](../README.md) - Project overview
- [../vitest.config.ts](../vitest.config.ts) - Unit test configuration
- [../e2e/playwright.config.ts](../e2e/playwright.config.ts) - E2E test configuration
