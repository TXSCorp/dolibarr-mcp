import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import dotenv from "dotenv";
import express, { Request, Response } from "express";

import { DolibarrAPI } from "./api.js";

// --- Import all tool definitions ---
import { thirdpartyTools, handleThirdpartyTool } from "./tools/thirdparties.js";
import { invoiceTools, handleInvoiceTool } from "./tools/invoices.js";
import { proposalTools, handleProposalTool } from "./tools/proposals.js";
import { orderTools, supplierOrderTools, handleOrderTool } from "./tools/orders.js";
import { productTools, handleProductTool } from "./tools/products.js";
import { accountingTools, handleAccountingTool } from "./tools/accounting.js";
import {
  crmTools, projectTools, hrTools, contractTools,
  handleCrmTool, handleProjectTool, handleHrTool, handleContractTool,
} from "./tools/crm_projects_hr.js";
import { setupTools, handleSetupTool } from "./tools/setup.js";

dotenv.config();

// ============================================================
// Configuration Check
// ============================================================
const DOLIBARR_URL = process.env.DOLIBARR_URL;
const DOLIBARR_API_KEY = process.env.DOLIBARR_API_KEY;
const MCP_PORT = parseInt(process.env.MCP_PORT || "5009", 10);
const MCP_HOST = process.env.MCP_HOST || "127.0.0.1";

if (!DOLIBARR_URL || !DOLIBARR_API_KEY) {
  console.error("Missing required environment variables: DOLIBARR_URL and DOLIBARR_API_KEY");
  process.exit(1);
}

const api = new DolibarrAPI(DOLIBARR_URL, DOLIBARR_API_KEY);

// ============================================================
// All tools aggregated
// ============================================================
const ALL_TOOLS = [
  ...thirdpartyTools,
  ...invoiceTools,
  ...proposalTools,
  ...orderTools,
  ...supplierOrderTools,
  ...productTools,
  ...accountingTools,
  ...crmTools,
  ...projectTools,
  ...hrTools,
  ...contractTools,
  ...setupTools,
];

const TOOL_NAME_SET = new Set(ALL_TOOLS.map((t) => t.name));

// ============================================================
// Server Factory
// ============================================================
// In stateless HTTP mode, each request gets its own Server + Transport
// pair. This function creates a fully configured MCP server instance.
function createServer(): Server {
  const server = new Server(
    {
      name: "mcp-dolibarr",
      version: "2.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Handler: List tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: ALL_TOOLS };
  });

  // Handler: Call a tool
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const safeArgs = (args || {}) as Record<string, unknown>;

    if (!TOOL_NAME_SET.has(name)) {
      throw new McpError(ErrorCode.MethodNotFound, `Dolibarr MCP tool not found: "${name}"`);
    }

    try {
      let result: string;

      if (thirdpartyTools.some((t) => t.name === name)) {
        result = await handleThirdpartyTool(name, safeArgs, api);
      } else if (invoiceTools.some((t) => t.name === name)) {
        result = await handleInvoiceTool(name, safeArgs, api);
      } else if (proposalTools.some((t) => t.name === name)) {
        result = await handleProposalTool(name, safeArgs, api);
      } else if ([...orderTools, ...supplierOrderTools].some((t) => t.name === name)) {
        result = await handleOrderTool(name, safeArgs, api);
      } else if (productTools.some((t) => t.name === name)) {
        result = await handleProductTool(name, safeArgs, api);
      } else if (accountingTools.some((t) => t.name === name)) {
        result = await handleAccountingTool(name, safeArgs, api);
      } else if (crmTools.some((t) => t.name === name)) {
        result = await handleCrmTool(name, safeArgs, api);
      } else if (projectTools.some((t) => t.name === name)) {
        result = await handleProjectTool(name, safeArgs, api);
      } else if (hrTools.some((t) => t.name === name)) {
        result = await handleHrTool(name, safeArgs, api);
      } else if (contractTools.some((t) => t.name === name)) {
        result = await handleContractTool(name, safeArgs, api);
      } else if (setupTools.some((t) => t.name === name)) {
        result = await handleSetupTool(name, safeArgs, api);
      } else {
        throw new McpError(ErrorCode.MethodNotFound, `Tool not assigned to a module: "${name}"`);
      }

      return {
        content: [{ type: "text", text: result }],
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      if (error instanceof McpError) throw error;

      return {
        content: [
          {
            type: "text",
            text: `Error executing "${name}":\n${message}`,
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}

// ============================================================
// Express HTTP Server
// ============================================================
const app = express();
app.use(express.json());

// Health check (used by ALB target group)
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "dolibarr-mcp", tools: ALL_TOOLS.length });
});

// MCP endpoint - stateless mode (new server+transport per request)
app.post("/mcp", async (req: Request, res: Response) => {
  try {
    const server = createServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // stateless - no session persistence
    });

    res.on("close", () => {
      transport.close();
      server.close();
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("MCP request error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

// MCP spec requires handling GET and DELETE on the endpoint
app.get("/mcp", (_req: Request, res: Response) => {
  res.status(405).json({
    jsonrpc: "2.0",
    error: { code: -32000, message: "Method not allowed. Use POST for stateless mode." },
    id: null,
  });
});

app.delete("/mcp", (_req: Request, res: Response) => {
  res.status(405).json({
    jsonrpc: "2.0",
    error: { code: -32000, message: "Method not allowed." },
    id: null,
  });
});

// ============================================================
// Start
// ============================================================
app.listen(MCP_PORT, MCP_HOST, () => {
  console.log(`Dolibarr MCP server v2.1.0 listening on ${MCP_HOST}:${MCP_PORT}`);
  console.log(`  Tools: ${ALL_TOOLS.length}`);
  console.log(`  Health: http://${MCP_HOST}:${MCP_PORT}/health`);
  console.log(`  MCP:    http://${MCP_HOST}:${MCP_PORT}/mcp`);
  console.log(`  Dolibarr: ${DOLIBARR_URL}`);
});
