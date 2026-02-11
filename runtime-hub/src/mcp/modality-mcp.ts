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

const HUB_URL = process.env.HUB_URL || "http://localhost:3001";
const PROJECT_ROOT = process.env.PROJECT_ROOT || path.join(process.cwd(), "..");

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

interface ActiveContext {
  modality: string;
  filePath: string;
  timestamp: string;
}

// Helper Functions
async function getActiveContext(): Promise<ActiveContext | null> {
  try {
    const res = await fetch(`${HUB_URL}/context/active`);
    if (!res.ok) return null;
    const data = (await res.json()) as ActiveContext;
    if (!data.filePath) return null;
    return data;
  } catch (error) {
    console.error("Error fetching active context:", error);
    return null;
  }
}

async function readFile(filePath: string): Promise<string> {
  // Use the /artifacts endpoint which aliases to /files
  const res = await fetch(`${HUB_URL}/artifacts/${filePath}`);
  if (!res.ok) {
    throw new Error(`Failed to read file '${filePath}': ${res.statusText}`);
  }
  return await res.text();
}

async function writeFile(filePath: string, content: string, reason: string): Promise<void> {
  const res = await fetch(`${HUB_URL}/artifacts/${filePath}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content,
      opts: {
        actor: "agent",
        reason,
        createSnapshot: true,
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to write file '${filePath}': ${res.statusText}`);
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
      const content = await readFile(ctx.filePath);
      return {
        contents: [{
          uri: "active://whiteboard",
          mimeType: "text/vnd.mermaid",
          text: `// Active Whiteboard: ${ctx.filePath}\n${content}`,
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

      // Drawing Tools (Phase 1 Stubs)
      {
        name: "drawing.inspect_scene",
        description: "Inspect the scene graph of a drawing artifact (Stub for Phase 1)",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "drawing.propose_patch",
        description: "Propose a patch to the drawing scene graph (Stub for Phase 1)",
        inputSchema: {
          type: "object",
          properties: {
            patch: { type: "object" },
          },
          required: ["patch"],
        },
      },
      {
        name: "drawing.apply_patch",
        description: "Apply a patch to the drawing scene graph (Stub for Phase 1)",
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
      const files = await fs.readdir(designDir);
      const whiteboards = files
        .filter(f => f.endsWith(".graph.mmd"))
        .map(f => f.replace(".graph.mmd", ""));
      
      return {
        content: [{ type: "text", text: `Available whiteboards:\n${whiteboards.join("\n")}` }],
      };
    } catch (error: any) {
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
      filePath = ctx.filePath;
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
      filePath = ctx.filePath;
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

  // --- Drawing Tools (Stubs) ---
  if (name.startsWith("drawing.")) {
    return {
      content: [{ type: "text", text: `Tool '${name}' is not yet implemented (Phase 1).` }],
    };
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
