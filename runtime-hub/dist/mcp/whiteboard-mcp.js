import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, ListResourcesRequestSchema, ReadResourceRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import fetch from "node-fetch";
import fs from "fs/promises";
import path from "path";
const HUB_URL = process.env.HUB_URL || "http://localhost:3001";
const PROJECT_ROOT = process.env.PROJECT_ROOT || path.join(process.cwd(), "..");
const server = new Server({
    name: "whiteboard-server",
    version: "0.1.0",
}, {
    capabilities: {
        tools: {},
        resources: {},
    },
});
async function getActiveWhiteboard() {
    try {
        const ctxRes = await fetch(`${HUB_URL}/context/active-whiteboard`);
        const ctx = (await ctxRes.json());
        return ctx.activeWhiteboard;
    }
    catch {
        return null;
    }
}
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
        try {
            const activePath = await getActiveWhiteboard();
            if (!activePath) {
                return {
                    contents: [{
                            uri: "active://whiteboard",
                            mimeType: "text/plain",
                            text: "No whiteboard is currently active in the user's view.",
                        }],
                };
            }
            const contentRes = await fetch(`${HUB_URL}/artifacts/${activePath}`);
            if (!contentRes.ok) {
                throw new Error(`Failed to read active whiteboard: ${contentRes.statusText}`);
            }
            const mermaid = await contentRes.text();
            return {
                contents: [{
                        uri: "active://whiteboard",
                        mimeType: "text/vnd.mermaid",
                        text: `// Active Whiteboard: ${activePath}\n${mermaid}`,
                    }],
            };
        }
        catch (err) {
            return {
                contents: [{
                        uri: "active://whiteboard",
                        mimeType: "text/plain",
                        text: `Error reading active whiteboard: ${err.message}`,
                    }],
            };
        }
    }
    throw new Error(`Unknown resource: ${request.params.uri}`);
});
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "list_whiteboards",
                description: "List all available whiteboard artifacts (.graph.mmd files) in the design directory",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            },
            {
                name: "read_whiteboard",
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
                name: "update_whiteboard",
                description: "Update the logical structure of a whiteboard using Mermaid syntax. If no name is provided, updates the currently active whiteboard. IMPORTANT: Always use standard Mermaid headers (e.g. 'graph TD', 'sequenceDiagram', 'classDiagram') to ensure correct polymorphic layout strategy.",
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
        ],
    };
});
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    if (name === "list_whiteboards") {
        try {
            const designDir = path.join(PROJECT_ROOT, "design");
            const files = await fs.readdir(designDir);
            const whiteboards = files
                .filter(f => f.endsWith(".graph.mmd"))
                .map(f => f.replace(".graph.mmd", ""));
            return {
                content: [{ type: "text", text: `Available whiteboards:\n${whiteboards.join("\n")}` }],
            };
        }
        catch (error) {
            return {
                content: [{ type: "text", text: `Error listing whiteboards: ${error.message}` }],
                isError: true,
            };
        }
    }
    if (name === "read_whiteboard") {
        const wbName = args.name;
        let filePath;
        if (!wbName) {
            const activePath = await getActiveWhiteboard();
            if (!activePath) {
                return { content: [{ type: "text", text: "No whiteboard name provided and no active whiteboard found." }], isError: true };
            }
            filePath = activePath;
        }
        else {
            filePath = `design/${wbName}.graph.mmd`;
        }
        try {
            const response = await fetch(`${HUB_URL}/artifacts/${filePath}`);
            if (!response.ok) {
                if (response.status === 404) {
                    return {
                        content: [{ type: "text", text: `Whiteboard '${wbName || filePath}' not found.` }],
                        isError: true,
                    };
                }
                throw new Error(`Hub API error: ${response.statusText}`);
            }
            const content = await response.text();
            return {
                content: [{ type: "text", text: content }],
            };
        }
        catch (error) {
            return {
                content: [{ type: "text", text: `Error reading whiteboard: ${error.message}` }],
                isError: true,
            };
        }
    }
    if (name === "update_whiteboard") {
        const wbName = args.name;
        const mermaid = args.mermaid;
        let filePath;
        if (!wbName) {
            const activePath = await getActiveWhiteboard();
            if (!activePath) {
                return { content: [{ type: "text", text: "No whiteboard name provided and no active whiteboard found." }], isError: true };
            }
            filePath = activePath;
        }
        else {
            filePath = `design/${wbName}.graph.mmd`;
        }
        try {
            const response = await fetch(`${HUB_URL}/artifacts/${filePath}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: mermaid,
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
                content: [{ type: "text", text: `Successfully updated whiteboard '${wbName || filePath}' with new Mermaid logic.` }],
            };
        }
        catch (error) {
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
