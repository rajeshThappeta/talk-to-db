import { MCPAdapter } from "@langchain/mcp-adapters";

// Tools the agent must NOT see
// Tools the agent must NOT see
const DISABLED_TOOLS = [
  "connect",
  "disconnect",
  "list-connections", // only our read-only "preconfigured" connection
  "search-knowledge",
  "list-knowledge-sources", // MongoDB docs search, not our data
  "mongodb-logs", // server internals
  "export", // writes export files to disk
  // not needed to answer questions, and costly in tokens
  "explain", // ~3,000 tokens of schema; query-plan analysis
  "aggregate-db", // database-level pipelines; aggregate covers us
  "db-stats",
  "collection-storage-size",
  "collection-indexes",
  "list-databases", // we always use sample_mflix
];

const adapter = new MCPAdapter({
  servers: {
    mongodb: {
      command: "npx",
      args: ["mongodb-mcp-server", "--readOnly"],
      env: {
        ...process.env,
        MDB_MCP_CONNECTION_STRING: process.env.MONGO_URI,
        MDB_MCP_DISABLED_TOOLS: DISABLED_TOOLS.join(","),
        MDB_MCP_TELEMETRY: "disabled", // optional: no usage data sent to MongoDB
      },
    },
  },
});

export function getMongoTools() {
  return adapter.listTools();
}

export function closeMongoMcp() {
  return adapter.close();
}
