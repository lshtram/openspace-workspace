import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fetch from "node-fetch";

const HUB_URL = process.env.HUB_URL || "http://localhost:3001";

const server = new Server(
  {
    name: "whiteboard-server",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "read_whiteboard",
        description: "Read the elements of a whiteboard artifact",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "The name of the whiteboard (e.g. 'architecture-diagram')",
            },
          },
          required: ["name"],
        },
      },
      {
        name: "update_whiteboard",
        description: "Create or update a whiteboard artifact with new elements",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "The name of the whiteboard",
            },
            elements: {
              type: "array",
              items: { type: "object" },
              description: "The Excalidraw elements array",
            },
          },
          required: ["name", "elements"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "read_whiteboard") {
    const wbName = (args as any).name;
    const filePath = `whiteboards/${wbName}.json`;
    
    try {
      const response = await fetch(`${HUB_URL}/artifacts/${filePath}`);
      if (!response.ok) {
        if (response.status === 404) {
          return {
            content: [{ type: "text", text: `Whiteboard '${wbName}' not found.` }],
            isError: true,
          };
        }
        throw new Error(`Hub API error: ${response.statusText}`);
      }
      
      const content = await response.text();
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

  if (name === "update_whiteboard") {
    const wbName = (args as any).name;
    const elements = (args as any).elements;
    const filePath = `whiteboards/${wbName}.json`;

    try {
      const response = await fetch(`${HUB_URL}/artifacts/${filePath}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: JSON.stringify(elements, null, 2),
          opts: {
            actor: "agent",
            reason: "Updated via update_whiteboard tool",
            createSnapshot: true,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Hub API error: ${response.statusText}`);
      }

      return {
        content: [{ type: "text", text: `Successfully updated whiteboard '${wbName}'.` }],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Error updating whiteboard: ${error.message}` }],
        isError: true,
      };
    }
  }

  throw new Error(`Unknown tool: ${name}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Whiteboard MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
