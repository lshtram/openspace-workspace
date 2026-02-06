# Development Scripts

This directory contains automation scripts to help maintain code quality and streamline the development workflow.

## Scripts

### 🚀 pre-pr.sh - Full Pre-PR Validation

**Purpose**: Comprehensive validation before creating a pull request. Ensures all code passes quality checks.

**What it checks**:
- ✓ Git status (warns about uncommitted changes)
- ✓ TypeScript type checking
- ✓ ESLint linting
- ✓ Unit tests (Vitest)
- ✓ Production build
- ✓ E2E tests (Playwright) - optional, prompts user

**Usage**:
```bash
# From project root
npm run pre-pr

# Or directly
./scripts/pre-pr.sh
```

**When to use**: Before creating a pull request or pushing to remote

**Time**: ~5-10 minutes (depending on whether E2E tests are run)

---

### ⚡ quick-check.sh - Fast Development Checks

**Purpose**: Quick validation during development. Runs fast checks only (no E2E tests).

**What it checks**:
- ✓ TypeScript type checking
- ✓ ESLint linting
- ✓ Unit tests (Vitest)
- ✓ Production build

**Usage**:
```bash
# From project root
npm run check

# Or directly
./scripts/quick-check.sh
```

**When to use**: 
- During active development to catch issues early
- Before committing code
- After making significant changes
- As a pre-commit hook (optional)

**Time**: ~30-60 seconds

---

## Workflow Recommendations

### Daily Development
```bash
# 1. Make your changes
# 2. Run quick check frequently
npm run check

# 3. Fix any issues
npm run format  # Auto-fix formatting
npm run lint    # Check remaining lint issues
npm run typecheck  # Focus on type errors
```

### Before Committing
```bash
# Run quick check to ensure nothing is broken
npm run check

# If all passes, commit
git add .
git commit -m "your message"
```

### Before Creating PR
```bash
# Run full validation including E2E tests
npm run pre-pr

# If all passes, push and create PR
git push origin your-branch-name
```

### Debugging Test Failures
```bash
# Unit tests with UI
npm run test:ui

# E2E tests with UI
npm run test:e2e:ui

# Check specific test file
npm run test -- path/to/test.test.ts

# E2E tests in headed mode
npx playwright test --headed
```

---

## Exit Codes

Both scripts use standard exit codes:
- `0` - All checks passed
- `1` - One or more checks failed

This makes them suitable for CI/CD pipelines and pre-commit hooks.

---

## CI/CD Integration

These scripts are designed to work in CI environments:

```yaml
# Example GitHub Actions workflow
- name: Run validation
  run: npm run pre-pr
  env:
    CI: true
```

In CI mode:
- Playwright retries flaky tests up to 2 times
- Uses single worker for E2E tests (more stable)
- Fails if `test.only` is found
- Uses existing dev server (CI typically runs separately)

---

## Logs

Both scripts save detailed logs to `/tmp/`:
- `/tmp/typecheck.log` - TypeScript errors
- `/tmp/lint.log` - ESLint warnings/errors
- `/tmp/unit-tests.log` - Unit test results
- `/tmp/build.log` - Build output
- `/tmp/e2e-tests.log` - E2E test results (pre-pr only)

Check these files if you need more details about failures.

---

## Common Issues & Solutions

### "package.json not found"
**Problem**: Script not run from project root  
**Solution**: `cd openspace-client && npm run check`

### "Permission denied"
**Problem**: Script not executable  
**Solution**: `chmod +x scripts/*.sh`

### "Playwright browsers not installed"
**Problem**: First time running E2E tests  
**Solution**: Script will auto-install, or run `npx playwright install chromium`

### "No test files found"
**Problem**: No unit tests exist yet (expected)  
**Solution**: This is normal - we're adding unit tests progressively

### Type checking fails but build succeeds
**Problem**: Different tsconfig for build vs checking  
**Solution**: Check `tsconfig.app.json` and `tsconfig.json` alignment

---

## Script Development

### Making Changes

If you need to modify these scripts:

1. Edit the script file
2. Test locally: `./scripts/script-name.sh`
3. Verify exit codes: `echo $?` (should be 0 on success)
4. Test with failures intentionally
5. Update this README if behavior changes

### Adding New Scripts

1. Create script in `scripts/` directory
2. Make executable: `chmod +x scripts/your-script.sh`
3. Add to `package.json` scripts section
4. Document here in README
5. Test thoroughly before committing

---

## Future Enhancements

Potential improvements:
- [ ] Add coverage thresholds for unit tests
- [ ] Integrate with pre-commit hooks (husky)
- [ ] Add performance regression checks
- [ ] Bundle size analysis and limits
- [ ] Accessibility testing (axe-core)
- [ ] Visual regression testing
- [ ] Security vulnerability scanning (npm audit)
- [ ] License compliance checking

---

## Support

For issues or questions:
1. Check logs in `/tmp/` for details
2. Review GitHub Actions workflow if CI fails
3. Consult main README.md for project setup
4. Ask in team chat or open an issue
