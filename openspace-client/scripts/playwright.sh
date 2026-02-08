#!/usr/bin/env bash
set -euo pipefail

# Work around Playwright mis-detecting Apple Silicon as mac-x64 in some
# sandboxed/macOS environments where CPU model metadata is unavailable.
if [[ -z "${PLAYWRIGHT_HOST_PLATFORM_OVERRIDE:-}" ]]; then
  override_candidate="$(
    node -e "
      const os = require('os')
      const { hostPlatform, shortPlatform } = require('./node_modules/playwright-core/lib/server/utils/hostPlatform')
      const needsOverride = os.platform() === 'darwin' && process.arch === 'arm64' && shortPlatform === 'mac-x64'
      if (needsOverride) process.stdout.write(hostPlatform + '-arm64')
    "
  )"

  if [[ -n "${override_candidate}" ]]; then
    export PLAYWRIGHT_HOST_PLATFORM_OVERRIDE="${override_candidate}"
  fi
fi

exec node ./node_modules/@playwright/test/cli.js "$@"
