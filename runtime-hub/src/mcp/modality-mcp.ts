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

const HUB_URL = process.env.HUB_URL || "http://localhost:3001";
const PROJECT_ROOT = process.env.PROJECT_ROOT || path.join(process.cwd(), "..");
const artifactVersions = new Map<string, number>();

const server = new Server(
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
    const rawData = (await res.json()) as any;
    
    // Normalize response to ActiveContext structure
    const data: ActiveContext = {
      modality: rawData.modality,
      data: {
        path: rawData.data?.path || rawData.filePath,
        location: rawData.data?.location
      }
    };

    if (!data.data.path) {
      logIo('failure', 'CONTEXT_READ', { url: `${HUB_URL}/context/active`, reason: 'missing path in response', rawData });
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
        mimeType: "text/vnd.mermaid",
        description: "The currently focused whiteboard diagram content (Mermaid syntax)",
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
          mimeType: "text/vnd.mermaid",
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
        name: "whiteboard.list",
        description: "List all available whiteboard artifacts (.graph.mmd files) in the design directory",
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
        description: "Update the logical structure of a whiteboard using Mermaid syntax. If no name is provided, updates the currently active whiteboard.",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "The name of the whiteboard (e.g. 'AuthFlow'). Optional if a whiteboard is active.",
            },
            mermaid: {
              type: "string",
              description: "The Mermaid code (flowchart or sequenceDiagram)",
            },
          },
          required: ["mermaid"],
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
    ],
  };
});

// Tool Handlers
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  // --- Whiteboard Tools ---
  if (name === "whiteboard.list") {
    try {
      const designDir = path.join(PROJECT_ROOT, "design");
      logIo('start', 'DESIGN_LIST', { designDir });
      const files = await fs.readdir(designDir);
      logIo('success', 'DESIGN_LIST', { designDir, count: files.length });
      const whiteboards = files
        .filter(f => f.endsWith(".graph.mmd"))
        .map(f => f.replace(".graph.mmd", ""));
      
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
      filePath = `design/${wbName}.graph.mmd`;
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
    const mermaid = (args as any)?.mermaid;
    let filePath: string;

    if (!wbName) {
      const ctx = await getActiveContext();
      if (!ctx || ctx.modality !== "whiteboard") {
        return { content: [{ type: "text", text: "No whiteboard name provided and no active whiteboard found." }], isError: true };
      }
      filePath = ctx.data.path;
    } else {
      filePath = `design/${wbName}.graph.mmd`;
    }

    try {
      await writeFile(filePath, mermaid, "Updated via whiteboard.update tool");
      return {
        content: [{ type: "text", text: `Successfully updated whiteboard '${wbName || filePath}' with new Mermaid logic.` }],
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

  throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Modality MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
