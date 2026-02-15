import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import fetch from "node-fetch";
import fs from "fs/promises";
import path from "path";
import { ActiveContext, MIN_INTERVAL } from "../interfaces/platform.js";
import { IDiagram, IOperation } from "../interfaces/IDrawing.js";
import { parseActiveContextResponse } from "../interfaces/context-contract.js";
import { assertHandoffPayload } from "../interfaces/handoff-contract.js";

const HUB_URL = process.env.HUB_URL || "http://localhost:3001";
const PROJECT_ROOT = process.env.PROJECT_ROOT || process.cwd();
const artifactVersions = new Map<string, number>();

export const server = new Server(
  {
    name: "modality-mcp-server",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

const now = () => new Date().toISOString();

const logIo = (status: 'start' | 'success' | 'failure', operation: string, meta: Record<string, unknown>) => {
  const payload = { ...meta, ts: now() };
  const prefix = `[${payload.ts}] MCP_${operation}_${status.toUpperCase()}`;
  if (status === 'failure') {
    console.error(prefix, payload);
    return;
  }
  console.log(prefix, payload);
};

const patchesStore = new Map<string, { ops: IOperation[], intent: string }>();

// ---------------------------------------------------------------------------
// Agent-Modality Control: helper to POST commands to the Hub
// ---------------------------------------------------------------------------
async function postHubCommand(
  commandType: string,
  payload: Record<string, unknown>,
): Promise<{ content: { type: string; text: string }[]; isError?: boolean }> {
  const opName = `COMMAND_${commandType.replace('.', '_').toUpperCase()}`;
  logIo('start', opName, { commandType, payload });

  try {
    const res = await fetch(`${HUB_URL}/commands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: commandType, payload }),
    });

    if (!res.ok) {
      const errorBody = await res.json() as { error?: string };
      const reason = errorBody?.error || `HTTP ${res.status}`;
      logIo('failure', opName, { commandType, status: res.status, error: reason });
      return {
        content: [{ type: 'text', text: `Command ${commandType} failed: ${reason}` }],
        isError: true,
      };
    }

    const body = await res.json() as { commandId?: string };
    logIo('success', opName, { commandType, commandId: body.commandId });
    return {
      content: [{ type: 'text', text: `Command sent: ${commandType} (commandId: ${body.commandId})` }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logIo('failure', opName, { commandType, error: message });
    return {
      content: [{ type: 'text', text: `Command ${commandType} failed: ${message}` }],
      isError: true,
    };
  }
}

// Helper to validate drawing operations
function validateDrawingOps(ops: any): ops is IOperation[] {
  if (!Array.isArray(ops)) return false;
  for (const op of ops) {
    if (!op || typeof op.type !== 'string') return false;
    // Basic type check for known operations
    const knownTypes = ['addNode', 'updateNode', 'removeNode', 'addEdge', 'updateEdge', 'removeEdge', 'updateNodeLabel', 'updateNodeLayout'];
    if (!knownTypes.includes(op.type)) return false;
  }
  return true;
}

// Helper Functions
async function getActiveContext(): Promise<ActiveContext | null> {
  try {
    logIo('start', 'CONTEXT_READ', { url: `${HUB_URL}/context/active` });
    const res = await fetch(`${HUB_URL}/context/active`);
    if (!res.ok) {
      logIo('failure', 'CONTEXT_READ', { url: `${HUB_URL}/context/active`, status: res.status });
      return null;
    }
    const rawData = (await res.json()) as unknown;
    const data = parseActiveContextResponse(rawData);

    if (!data) {
      return null;
    }

    logIo('success', 'CONTEXT_READ', { url: `${HUB_URL}/context/active` });
    return data;
  } catch (error) {
    logIo('failure', 'CONTEXT_READ', {
      url: `${HUB_URL}/context/active`,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

async function readFile(filePath: string): Promise<string> {
  logIo('start', 'FILE_READ', { filePath });
  const res = await fetch(`${HUB_URL}/files/${filePath}`);
  if (!res.ok) {
    logIo('failure', 'FILE_READ', { filePath, status: res.status });
    throw new Error(`Failed to read file '${filePath}': ${res.statusText}`);
  }
  logIo('success', 'FILE_READ', { filePath, status: res.status });
  return await res.text();
}

async function writeFile(filePath: string, content: string, reason: string): Promise<void> {
  logIo('start', 'PATCH_WRITE', { filePath });

  let baseVersion = artifactVersions.get(filePath) ?? 0;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const res = await fetch(`${HUB_URL}/files/${filePath}/patch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        baseVersion,
        actor: "agent",
        intent: reason,
        ops: [{ op: "replace_content", content }],
      }),
    });

    if (res.ok) {
      const payload = (await res.json()) as { version?: number };
      if (typeof payload.version === 'number') {
        artifactVersions.set(filePath, payload.version);
      } else {
        artifactVersions.set(filePath, baseVersion + 1);
      }
      logIo('success', 'PATCH_WRITE', { filePath, status: res.status, version: artifactVersions.get(filePath) });
      return;
    }

    if (res.status === 409 && attempt === 0) {
      const conflict = (await res.json()) as { currentVersion?: number };
      baseVersion = conflict.currentVersion ?? baseVersion + 1;
      artifactVersions.set(filePath, baseVersion);
      await new Promise((resolve) => setTimeout(resolve, MIN_INTERVAL));
      continue;
    }

    const errorText = await res.text();
    logIo('failure', 'PATCH_WRITE', { filePath, status: res.status, error: errorText });
    throw new Error(`Failed to patch file '${filePath}': ${res.status} ${res.statusText}`);
  }
}

// Resource Handlers
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "active://whiteboard",
        name: "Active Whiteboard Context",
        mimeType: "application/json",
        description: "The currently focused whiteboard diagram content (tldraw JSON format)",
      },
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  if (request.params.uri === "active://whiteboard") {
    const ctx = await getActiveContext();
    
    // Check if active context is actually a whiteboard
    if (!ctx || ctx.modality !== "whiteboard") {
      return {
        contents: [{
          uri: "active://whiteboard",
          mimeType: "text/plain",
          text: "No whiteboard is currently active in the user's view.",
        }],
      };
    }

    try {
      const content = await readFile(ctx.data.path);
      return {
        contents: [{
          uri: "active://whiteboard",
          mimeType: "application/json",
          text: `// Active Whiteboard: ${ctx.data.path}\n${content}`,
        }],
      };
    } catch (err: any) {
      return {
        contents: [{
          uri: "active://whiteboard",
          mimeType: "text/plain",
          text: `Error reading active whiteboard: ${err.message}`,
        }],
      };
    }
  }
  throw new McpError(ErrorCode.InvalidRequest, `Unknown resource: ${request.params.uri}`);
});

// Tool Definitions
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // Whiteboard Tools (Legacy + Namespaced)
      {
        name: "modality.validate_handoff",
        description:
          "Validate and normalize a cross-modality handoff payload including source modality, target path/id, and optional location metadata",
        inputSchema: {
          type: "object",
          properties: {
            sourceModality: { type: "string" },
            target: {
              type: "object",
              properties: {
                path: { type: "string" },
                id: { type: "string" },
              },
            },
            location: {
              type: "object",
              properties: {
                startLine: { type: "integer" },
                endLine: { type: "integer" },
              },
            },
          },
          required: ["sourceModality", "target"],
        },
      },
      {
        name: "whiteboard.list",
        description: "List all available whiteboard artifacts (.diagram.json files) in the design directory",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "whiteboard.read",
        description: "Read the elements of a whiteboard artifact. If no name is provided, reads the currently active whiteboard.",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "The name of the whiteboard (e.g. 'AuthFlow'). Optional if a whiteboard is active.",
            },
          },
        },
      },
      {
        name: "whiteboard.update",
        description: "Update the content of a whiteboard using tldraw JSON format. If no name is provided, updates the currently active whiteboard.",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "The name of the whiteboard (e.g. 'AuthFlow'). Optional if a whiteboard is active.",
            },
            content: {
              type: "string",
              description: "The JSON content for the tldraw whiteboard",
            },
          },
          required: ["content"],
        },
      },

      // Drawing Tools
      {
        name: "drawing.inspect_scene",
        description: "Inspect the scene graph of the currently active drawing",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "drawing.propose_patch",
        description: "Propose a patch to the drawing scene graph",
        inputSchema: {
          type: "object",
          properties: {
            patch: { 
              type: "array",
              items: { type: "object" },
              description: "Array of IOperation objects"
            },
            intent: {
              type: "string",
              description: "The purpose of this patch"
            }
          },
          required: ["patch"],
        },
      },
      {
        name: "drawing.apply_patch",
        description: "Apply a previously proposed patch to the drawing scene graph",
        inputSchema: {
          type: "object",
          properties: {
            patchId: { type: "string" },
          },
          required: ["patchId"],
        },
      },
      // Presentation Tools
      {
        name: "presentation.list",
        description: "List all available presentation decks (.deck.md files) in the design/deck directory",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "presentation.read",
        description: "Read a presentation deck. If no name is provided, reads the currently active deck.",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "The name of the deck (e.g. 'Overview'). Optional if a deck is active.",
            },
          },
        },
      },
      {
        name: "presentation.update",
        description: "Update a presentation deck content. If no name is provided, updates the currently active deck.",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "The name of the deck. Optional if active.",
            },
            content: {
              type: "string",
              description: "The full markdown content of the deck.",
            },
          },
          required: ["content"],
        },
      },
      {
        name: "presentation.read_slide",
        description: "Read a specific slide from a deck.",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "The name of the deck. Optional if active.",
            },
            index: {
              type: "integer",
              description: "The slide index (0-based).",
            },
          },
          required: ["index"],
        },
      },
      {
        name: "presentation.update_slide",
        description: "Update or insert a specific slide in a deck.",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "The name of the deck. Optional if active.",
            },
            index: {
              type: "integer",
              description: "The slide index (0-based).",
            },
            content: {
              type: "string",
              description: "The markdown content of the slide.",
            },
            operation: {
              type: "string",
              enum: ["replace", "insert", "delete"],
              description: "The operation to perform (default: replace).",
            },
          },
          required: ["index"],
        },
      },

      // ── Agent-Modality Control Tools ──────────────────────────────────
      {
        name: "pane.open",
        description: "Open a new pane in the client UI. Posts a command to the Hub which is broadcast to connected clients via SSE.",
        inputSchema: {
          type: "object",
          properties: {
            type: {
              type: "string",
              description: "The SpaceType for the pane (e.g. 'editor', 'whiteboard', 'presentation', 'drawing').",
            },
            title: { type: "string", description: "Title for the pane tab." },
            contentId: { type: "string", description: "Optional content identifier." },
            targetPaneId: { type: "string", description: "Optional target pane to open content in." },
            newPane: { type: "boolean", description: "Whether to open in a new split pane." },
            splitDirection: {
              type: "string",
              enum: ["horizontal", "vertical"],
              description: "Direction to split when newPane is true.",
            },
          },
          required: ["type"],
        },
      },
      {
        name: "pane.close",
        description: "Close a pane or tab in the client UI.",
        inputSchema: {
          type: "object",
          properties: {
            paneId: { type: "string", description: "The ID of the pane to close." },
            contentId: { type: "string", description: "The content ID to find and close." },
          },
        },
      },
      {
        name: "pane.list",
        description: "List the current pane layout and open tabs in the client UI.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "pane.focus",
        description: "Focus a specific pane or tab in the client UI.",
        inputSchema: {
          type: "object",
          properties: {
            paneId: { type: "string", description: "The ID of the pane to focus." },
            contentId: { type: "string", description: "The content ID to find and focus." },
          },
        },
      },
      {
        name: "editor.open",
        description: "Open a file in the editor pane. Posts a command to the Hub which is broadcast to connected clients via SSE.",
        inputSchema: {
          type: "object",
          properties: {
            path: { type: "string", description: "File path to open in the editor." },
            line: { type: "integer", description: "Line number to scroll to." },
            endLine: { type: "integer", description: "End line for range highlight." },
            highlight: { type: "boolean", description: "Whether to highlight the line range." },
            mode: {
              type: "string",
              enum: ["edit", "view"],
              description: "Editor mode (default: edit).",
            },
            newPane: { type: "boolean", description: "Whether to open in a new split pane." },
            splitDirection: {
              type: "string",
              enum: ["horizontal", "vertical"],
              description: "Direction to split when newPane is true.",
            },
          },
          required: ["path"],
        },
      },
      {
        name: "editor.read_file",
        description: "Read the contents of a file from the project. Optionally slice by line range.",
        inputSchema: {
          type: "object",
          properties: {
            path: { type: "string", description: "File path to read." },
            startLine: { type: "integer", description: "First line to include (1-based)." },
            endLine: { type: "integer", description: "Last line to include (1-based, inclusive)." },
          },
          required: ["path"],
        },
      },
      {
        name: "editor.close",
        description: "Close a file tab in the editor.",
        inputSchema: {
          type: "object",
          properties: {
            path: { type: "string", description: "File path to close." },
          },
          required: ["path"],
        },
      },
      {
        name: "presentation.open",
        description: "Open a presentation deck in the client UI pane. Posts a command to the Hub which is broadcast to connected clients via SSE.",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", description: "The deck name (e.g. 'Overview')." },
            path: { type: "string", description: "The deck file path." },
            newPane: { type: "boolean", description: "Whether to open in a new split pane." },
          },
        },
      },
      {
        name: "presentation.navigate",
        description: "Navigate to a specific slide in an open presentation.",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", description: "The deck name. Optional." },
            slideIndex: { type: "integer", description: "The slide index to navigate to (0-based)." },
          },
          required: ["slideIndex"],
        },
      },
    ],
  };
});

// Tool Handlers
export const callToolHandler = async (request: { params: { name: string, arguments?: any } }) => {
  const { name, arguments: args } = request.params;

  if (name === "modality.validate_handoff") {
    try {
      const payload = assertHandoffPayload(args ?? {});
      return {
        content: [{ type: "text", text: JSON.stringify(payload) }],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: error instanceof Error ? error.message : String(error) }],
        isError: true,
      };
    }
  }

  // --- Agent-Modality Control: pane.* tools ---
  if (name === "pane.open") {
    return postHubCommand("pane.open", (args ?? {}) as Record<string, unknown>);
  }

  if (name === "pane.close") {
    return postHubCommand("pane.close", (args ?? {}) as Record<string, unknown>);
  }

  if (name === "pane.list") {
    try {
      logIo('start', 'PANE_LIST', { url: `${HUB_URL}/panes/state` });
      const res = await fetch(`${HUB_URL}/panes/state`);
      const data = await res.json();
      logIo('success', 'PANE_LIST', { url: `${HUB_URL}/panes/state` });

      if (!data) {
        return {
          content: [{ type: "text", text: "No pane state available. The client has not reported its layout yet." }],
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logIo('failure', 'PANE_LIST', { error: message });
      return {
        content: [{ type: "text", text: `Error reading pane state: ${message}` }],
        isError: true,
      };
    }
  }

  if (name === "pane.focus") {
    return postHubCommand("pane.focus", (args ?? {}) as Record<string, unknown>);
  }

  // --- Agent-Modality Control: editor.* tools ---
  if (name === "editor.open") {
    return postHubCommand("editor.open", (args ?? {}) as Record<string, unknown>);
  }

  if (name === "editor.read_file") {
    const filePath = (args as any)?.path;
    if (!filePath || typeof filePath !== 'string') {
      return {
        content: [{ type: "text", text: "path is required for editor.read_file" }],
        isError: true,
      };
    }

    try {
      const content = await readFile(filePath);
      const startLine = (args as any)?.startLine;
      const endLine = (args as any)?.endLine;

      if (typeof startLine === 'number' || typeof endLine === 'number') {
        const lines = content.split('\n');
        const start = typeof startLine === 'number' ? Math.max(0, startLine - 1) : 0;
        const end = typeof endLine === 'number' ? Math.min(lines.length, endLine) : lines.length;
        const sliced = lines.slice(start, end).join('\n');
        return {
          content: [{ type: "text", text: sliced }],
        };
      }

      return {
        content: [{ type: "text", text: content }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error reading file: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  }

  if (name === "editor.close") {
    return postHubCommand("editor.close", (args ?? {}) as Record<string, unknown>);
  }

  // --- Whiteboard Tools ---
  if (name === "whiteboard.list") {
    try {
      const designDir = path.join(PROJECT_ROOT, "design");
      logIo('start', 'DESIGN_LIST', { designDir });
      const files = await fs.readdir(designDir);
      logIo('success', 'DESIGN_LIST', { designDir, count: files.length });
      const whiteboards = files
        .filter(f => f.endsWith(".diagram.json"))
        .map(f => f.replace(".diagram.json", ""));
      
      return {
        content: [{ type: "text", text: `Available whiteboards:\n${whiteboards.join("\n")}` }],
      };
    } catch (error: any) {
      logIo('failure', 'DESIGN_LIST', {
        designDir: path.join(PROJECT_ROOT, "design"),
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        content: [{ type: "text", text: `Error listing whiteboards: ${error.message}` }],
        isError: true,
      };
    }
  }

  if (name === "whiteboard.read") {
    const wbName = (args as any)?.name;
    let filePath: string;

    if (!wbName) {
      const ctx = await getActiveContext();
      if (!ctx || ctx.modality !== "whiteboard") {
        return { content: [{ type: "text", text: "No whiteboard name provided and no active whiteboard found." }], isError: true };
      }
      filePath = ctx.data.path;
    } else {
      filePath = `design/${wbName}.diagram.json`;
    }
    
    try {
      const content = await readFile(filePath);
      return {
        content: [{ type: "text", text: content }],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Error reading whiteboard: ${error.message}` }],
        isError: true,
      };
    }
  }

  if (name === "whiteboard.update") {
    const wbName = (args as any)?.name;
    const content = (args as any)?.content;
    let filePath: string;

    if (!wbName) {
      const ctx = await getActiveContext();
      if (!ctx || ctx.modality !== "whiteboard") {
        return { content: [{ type: "text", text: "No whiteboard name provided and no active whiteboard found." }], isError: true };
      }
      filePath = ctx.data.path;
    } else {
      filePath = `design/${wbName}.diagram.json`;
    }

    try {
      await writeFile(filePath, content, "Updated via whiteboard.update tool");
      return {
        content: [{ type: "text", text: `Successfully updated whiteboard '${wbName || filePath}' with new content.` }],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Error updating whiteboard: ${error.message}` }],
        isError: true,
      };
    }
  }

  // --- Drawing Tools ---
  if (name === "drawing.inspect_scene") {
    const ctx = await getActiveContext();
    if (!ctx || ctx.modality !== "drawing") {
      return { content: [{ type: "text", text: "No drawing is currently active." }], isError: true };
    }
    try {
      const content = await readFile(ctx.data.path);
      const diagram = JSON.parse(content) as IDiagram;
      
      // Return a summarized view
      const summary = {
        title: diagram.metadata.title,
        type: diagram.diagramType,
        nodeCount: diagram.nodes.length,
        edgeCount: diagram.edges.length,
        nodes: diagram.nodes.map(n => ({ id: n.id, kind: n.kind, label: n.label })),
        edges: diagram.edges.map(e => ({ id: e.id, from: e.from, to: e.to, relation: e.relation }))
      };

      return { content: [{ type: "text", text: JSON.stringify(summary, null, 2) }] };
    } catch (error: any) {
      return { content: [{ type: "text", text: `Error inspecting scene: ${error.message}` }], isError: true };
    }
  }

  if (name === "drawing.propose_patch") {
    const ops = (args as any).patch;
    const intent = (args as any).intent || "Modified via drawing.propose_patch";

    if (!validateDrawingOps(ops)) {
      return {
        content: [{ type: "text", text: "Invalid patch format. Must be an array of IOperation." }],
        isError: true
      };
    }

    const patchId = `patch-${Date.now()}`;
    patchesStore.set(patchId, { ops, intent });
    return {
      content: [{ type: "text", text: `Patch proposed with ID: ${patchId}\nOperations: ${ops.length}` }],
    };
  }

  if (name === "drawing.apply_patch") {
    const patchId = (args as any).patchId;
    const patch = patchesStore.get(patchId);
    if (!patch) {
      return { content: [{ type: "text", text: `Patch ID '${patchId}' not found.` }], isError: true };
    }

    const ctx = await getActiveContext();
    if (!ctx || ctx.modality !== "drawing") {
      return { content: [{ type: "text", text: "No drawing is currently active to apply the patch to." }], isError: true };
    }

    const filePath = ctx.data.path;
    let baseVersion = artifactVersions.get(filePath) ?? 0;

    try {
      logIo('start', 'PATCH_DRAWING', { filePath, patchId });

      for (let attempt = 0; attempt < 2; attempt += 1) {
        const res = await fetch(`${HUB_URL}/files/${filePath}/patch`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            baseVersion,
            actor: "agent",
            intent: patch.intent,
            ops: patch.ops,
          }),
        });

        if (res.ok) {
          const payload = (await res.json()) as { version?: number };
          if (typeof payload.version === 'number') {
            artifactVersions.set(filePath, payload.version);
          }
          patchesStore.delete(patchId);
          logIo('success', 'PATCH_DRAWING', { filePath, version: artifactVersions.get(filePath) });
          return { content: [{ type: "text", text: `Successfully applied patch ${patchId} to ${filePath}` }] };
        }

        if (res.status === 409 && attempt === 0) {
          const conflict = (await res.json()) as { currentVersion?: number };
          baseVersion = conflict.currentVersion ?? baseVersion + 1;
          artifactVersions.set(filePath, baseVersion);
          await new Promise((resolve) => setTimeout(resolve, MIN_INTERVAL));
          continue;
        }

        const errorText = await res.text();
        logIo('failure', 'PATCH_DRAWING', { filePath, status: res.status, error: errorText });
        return { 
          content: [{ type: "text", text: `Failed to apply patch: ${res.status} ${errorText}` }],
          isError: true 
        };
      }
      
      return { content: [{ type: "text", text: "Failed to apply patch after retrying." }], isError: true };
    } catch (error: any) {
      logIo('failure', 'PATCH_DRAWING', { filePath, error: error.message });
      return { content: [{ type: "text", text: `Error applying patch: ${error.message}` }], isError: true };
    }
  }

  // --- Presentation Tools ---
  if (name.startsWith("presentation.")) {
    const subName = name.split(".")[1];
    
    if (subName === "list") {
      try {
        const deckDir = path.join(PROJECT_ROOT, "design", "deck");
        logIo('start', 'DECK_LIST', { deckDir });
        const files = await fs.readdir(deckDir).catch(() => []);
        const decks = files
          .filter(f => f.endsWith(".deck.md"))
          .map(f => f.replace(".deck.md", ""));
        
        return {
          content: [{ type: "text", text: `Available presentation decks:\n${decks.length > 0 ? decks.join("\n") : "None"}` }],
        };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error listing decks: ${error.message}` }], isError: true };
      }
    }

    // Agent-Modality Control: open a presentation pane in the client UI
    if (subName === "open") {
      const payload: Record<string, unknown> = {};
      if ((args as any)?.name) payload.name = (args as any).name;
      if ((args as any)?.path) payload.path = (args as any).path;
      if ((args as any)?.newPane !== undefined) payload.newPane = (args as any).newPane;
      // Ensure at least name or path is provided
      if (!payload.name && !payload.path) {
        return {
          content: [{ type: "text", text: "name or path is required for presentation.open" }],
          isError: true,
        };
      }
      return postHubCommand("presentation.open", payload);
    }

    // Agent-Modality Control: navigate to a slide in the client UI
    if (subName === "navigate") {
      const slideIndex = (args as any)?.slideIndex;
      if (typeof slideIndex !== 'number') {
        return {
          content: [{ type: "text", text: "slideIndex (number) is required for presentation.navigate" }],
          isError: true,
        };
      }
      const payload: Record<string, unknown> = { slideIndex };
      if ((args as any)?.name) payload.name = (args as any).name;
      return postHubCommand("presentation.navigate", payload);
    }

    // Common logic for read/update/read_slide/update_slide
    let deckName = (args as any)?.name;
    let filePath: string;

    if (!deckName) {
      const ctx = await getActiveContext();
      if (!ctx || ctx.modality !== "presentation") {
        return { content: [{ type: "text", text: "No deck name provided and no active presentation found." }], isError: true };
      }
      filePath = ctx.data.path;
    } else {
      filePath = `design/deck/${deckName}.deck.md`;
    }

    if (subName === "read") {
      try {
        const content = await readFile(filePath);
        return { content: [{ type: "text", text: content }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error reading deck: ${error.message}` }], isError: true };
      }
    }

    if (subName === "update") {
      const content = (args as any).content;
      try {
        await writeFile(filePath, content, "Updated via presentation.update tool");
        return { content: [{ type: "text", text: `Successfully updated deck '${filePath}'.` }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error updating deck: ${error.message}` }], isError: true };
      }
    }

    if (subName === "read_slide") {
      const index = (args as any).index;
      try {
        const content = await readFile(filePath);
        const sections = content.split('\n---\n');
        const hasFrontmatter = sections[0].trim().startsWith('---');
        const slideOffset = hasFrontmatter ? 1 : 0;
        const actualIndex = index + slideOffset;
        
        if (actualIndex >= sections.length) {
          return { content: [{ type: "text", text: `Slide index ${index} out of bounds.` }], isError: true };
        }
        
        return { content: [{ type: "text", text: sections[actualIndex] }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error reading slide: ${error.message}` }], isError: true };
      }
    }

    if (subName === "update_slide") {
      const index = (args as any).index;
      const content = (args as any).content;
      const operation = (args as any).operation || "replace";
      
      let type: string;
      if (operation === "replace") type = "REPLACE_SLIDE";
      else if (operation === "insert") type = "INSERT_SLIDE";
      else if (operation === "delete") type = "DELETE_SLIDE";
      else return { content: [{ type: "text", text: `Invalid operation: ${operation}` }], isError: true };

      try {
        let baseVersion = artifactVersions.get(filePath) ?? 0;
        const res = await fetch(`${HUB_URL}/files/${filePath}/patch`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            baseVersion,
            actor: "agent",
            intent: `Slide update (${operation}) at index ${index}`,
            ops: [{ type, index, content }],
          }),
        });

        if (res.ok) {
          const payload = (await res.json()) as { version?: number };
          if (typeof payload.version === 'number') artifactVersions.set(filePath, payload.version);
          return { content: [{ type: "text", text: `Successfully applied ${operation} slide at index ${index} to ${filePath}` }] };
        }
        
        const errorText = await res.text();
        return { content: [{ type: "text", text: `Error updating slide: ${errorText}` }], isError: true };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error updating slide: ${error.message}` }], isError: true };
      }
    }
  }

  throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
};

server.setRequestHandler(CallToolRequestSchema, callToolHandler);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Modality MCP server running on stdio");
}

if (!process.env.VITEST) {
  main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
  });
}
