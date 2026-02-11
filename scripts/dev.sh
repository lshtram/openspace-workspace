#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HUB_DIR="$ROOT_DIR/runtime-hub"
CLIENT_DIR="$ROOT_DIR/openspace-client"

if [[ ! -d "$HUB_DIR" ]]; then
  echo "[dev] Missing runtime-hub directory: $HUB_DIR" >&2
  exit 1
fi

if [[ ! -d "$CLIENT_DIR" ]]; then
  echo "[dev] Missing openspace-client directory: $CLIENT_DIR" >&2
  exit 1
fi

echo "[dev] Starting runtime-hub (hub server)..."
( cd "$HUB_DIR" && npm run start:hub ) &
HUB_PID=$!

echo "[dev] Starting runtime-hub (whiteboard MCP)..."
( cd "$HUB_DIR" && npm run start:whiteboard ) &
MCP_PID=$!

echo "[dev] Starting openspace-client..."
( cd "$CLIENT_DIR" && npm run dev ) &
CLIENT_PID=$!

cleanup() {
  echo "[dev] Shutting down..."
  if kill -0 "$CLIENT_PID" 2>/dev/null; then
    kill "$CLIENT_PID"
  fi
  if kill -0 "$MCP_PID" 2>/dev/null; then
    kill "$MCP_PID"
  fi
  if kill -0 "$HUB_PID" 2>/dev/null; then
    kill "$HUB_PID"
  fi
}

trap cleanup INT TERM EXIT

wait "$CLIENT_PID"
