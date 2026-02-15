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

# Set environment variables for MCP server
export HUB_URL="http://localhost:3001"
export PROJECT_ROOT="$ROOT_DIR"

echo "[dev] Starting runtime-hub (hub server)..."
( cd "$HUB_DIR" && npm run start:hub ) &
HUB_PID=$!

echo "[dev] Waiting for hub server to be ready..."
sleep 3

# Check if hub server is responding
if ! curl -s -f "http://localhost:3001/context/active" > /dev/null 2>&1; then
  echo "[dev] ERROR: Hub server not responding on http://localhost:3001" >&2
  exit 1
fi

echo "[dev] Hub server ready on http://localhost:3001 ✅"

echo "[dev] Starting runtime-hub (modality MCP)..."
( cd "$HUB_DIR" && HUB_URL="$HUB_URL" PROJECT_ROOT="$PROJECT_ROOT" npm run start:modality ) &
MCP_PID=$!

echo "[dev] Waiting for MCP server to be ready..."
sleep 2

# Basic check - MCP server should be running (we can't easily test stdio from here)
if ! kill -0 "$MCP_PID" 2>/dev/null; then
  echo "[dev] ERROR: MCP server failed to start" >&2
  exit 1
fi

echo "[dev] MCP server started ✅"

echo "[dev] Starting openspace-client..."
( cd "$CLIENT_DIR" && npm run dev ) &
CLIENT_PID=$!

echo "[dev] Waiting for client to be ready..."
sleep 5

# Check if client is responding
if ! curl -s -f "http://localhost:5173" > /dev/null 2>&1; then
  echo "[dev] ERROR: Client server not responding on http://localhost:5173" >&2
  exit 1
fi

echo "[dev] Client server ready on http://localhost:5173 ✅"

echo ""
echo "[dev] 🎉 All servers are running!"
echo "  - Hub server: http://localhost:3001"
echo "  - Client server: http://localhost:5173"
echo "  - MCP server: stdio (connected to hub)"
echo ""
echo "[dev] Press Ctrl+C to stop all servers"

cleanup() {
  echo "[dev] Shutting down all servers..."
  if kill -0 "$CLIENT_PID" 2>/dev/null; then
    echo "[dev] Stopping client server..."
    kill "$CLIENT_PID"
  fi
  if kill -0 "$MCP_PID" 2>/dev/null; then
    echo "[dev] Stopping MCP server..."
    kill "$MCP_PID"
  fi
  if kill -0 "$HUB_PID" 2>/dev/null; then
    echo "[dev] Stopping hub server..."
    kill "$HUB_PID"
  fi
  echo "[dev] All servers stopped ✅"
}

trap cleanup INT TERM EXIT

wait "$CLIENT_PID"
