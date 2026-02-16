# OpenSpace

A modular workspace for AI-assisted development with integrated whiteboard, editor, drawing, and presentation modalities.

## Documentation

- **[Hub/MCP Architecture](./docs/architecture/HUB-MCP-ARCHITECTURE.md)** - Canonical technical reference for Hub/MCP multi-modal architecture
- **[Modality Platform V2 Spec](./docs/architecture/TECHSPEC-MODALITY-PLATFORM-V2.md)** - Contracts and execution order
- **[Modality Platform V2 Requirements](./docs/requirements/REQ-MODALITY-PLATFORM-V2.md)** - User stories and active backlog
- **[Architecture Review](./docs/ARCHITECTURE_REVIEW_OPENSPACE.md)** - Comprehensive review (2026-02-15, archived)

## Quick Start

```bash
# Start all services (hub, MCP server, client)
./scripts/dev.sh
```

This starts:
- **Hub server**: http://localhost:3001
- **Client**: http://localhost:5173

## Project Structure

```
openspace/                    # Monorepo root
├── runtime-hub/              # Hub server + MCP server
├── openspace-client/         # Frontend React app
├── scripts/dev.sh            # Dev server script
└── design/                   # User projects (diagrams, decks, etc.)
```

## Security Model

**See [Hub/MCP Architecture - Security Model](./docs/architecture/HUB-MCP-ARCHITECTURE.md#10-security-model) for complete details.**

### Hub Server Binding

By default, the Runtime Hub binds to `127.0.0.1` (localhost only) for security.

**Configuration (in priority order):**

1. **CLI Flag:** `node runtime-hub/src/hub-server.js --bind <address>`
2. **Environment Variable:** `HUB_BIND_ADDRESS=<address>`
3. **Default:** `127.0.0.1` (localhost only)

**Examples:**

```bash
# Default: Localhost only (secure)
npm run hub

# Bind to all interfaces (WARNING: exposes to network)
npm run hub -- --bind 0.0.0.0

# Bind to specific IP
HUB_BIND_ADDRESS=192.168.1.10 npm run hub
```

### Remote Access

**Do NOT expose the Hub directly to the internet or untrusted networks.**

The Hub has no authentication. Anyone with network access can:
- Read/write files under `design/`
- Send commands to your browser
- Monitor your activity via the SSE event stream

**For remote access, use:**
- **SSH Tunnel:** `ssh -L 3001:localhost:3001 user@remote-host`
- **VPN:** Access via secure VPN connection
- **Reverse Proxy:** Use nginx/caddy with authentication

### Path Traversal Protection

The Hub enforces a `design/` prefix for all artifact paths. Requests outside this directory return 403 Forbidden.
