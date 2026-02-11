# Runtime Hub API

Internal HTTP API used by OpenSpace client and MCP servers.

## Base URL

- Default: `http://localhost:3001`

## File Endpoints

### `GET /files/:path`
- Read file content as raw bytes.

### `POST /files/:path`
- Write file content.
- JSON body:
  - `content`: string (required)
  - `encoding`: `"base64"` (optional; decodes content before write)
  - `opts`: `WriteOptions` (optional metadata)

### `GET /artifacts/:path` (deprecated)
### `POST /artifacts/:path` (deprecated)
- Backward-compatible alias behavior to `/files/:path`.
- Kept for compatibility with existing clients and MCP tools.

## Context Endpoints

### `POST /context/active`
- Set active modality context.
- JSON body:
  - `modality`: `drawing | editor | whiteboard`
  - `filePath`: string (must resolve under `design/`)
- Response:
  - `{ success: true, activeContext: { modality, filePath, timestamp } }`

### `GET /context/active`
- Get active modality context.
- Response:
  - `null` if unset
  - `{ modality, filePath, timestamp }` when set

### `POST /context/active-whiteboard` (deprecated)
### `GET /context/active-whiteboard` (deprecated)
- Backward-compatible whiteboard-only context API.
- Still supported for existing whiteboard flows.

## Security and Path Constraints

- All file operations are constrained to `<project-root>/design`.
- Paths are normalized and blocked if they:
  - are empty,
  - contain `..`, or
  - do not start with `design/`.

## Notes

- Existing `/artifacts/*` and `/context/active-whiteboard` integrations continue to work.
- Deprecated endpoints return warning headers to help migration.
