import express from "express";
import { getMongoTools, closeMongoMcp } from "./mcp/mongodb.js";
import { createDbAgent, lastText, toolTrace } from "./agent/db-agent.js";

if (!process.env.MONGO_URI) {
  console.error("MONGO_URI is missing in .env");
  process.exit(1);
}

// 1. Start the MCP server and load its tools ONCE, before accepting requests
const tools = await getMongoTools();
const agent = createDbAgent(tools);
console.log(`🔌 MongoDB MCP: ${tools.length} tools loaded`);
for (const tool of tools) console.log(`   - ${tool.name}`);

const app = express();
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", tools: tools.length });
});

app.post("/api/ask", async (req, res) => {
  const { question } = req.body ?? {};

  if (typeof question !== "string" || !question.trim()) {
    return res
      .status(400)
      .json({ error: "question (non-empty string) is required" });
  }

  try {
    const result = await agent.invoke(
      { messages: [{ role: "user", content: question }] },
      { recursionLimit: 15 },
    );

    const toolCalls = toolTrace(result.messages);
    console.log(`\n❓ ${question}`);
    for (const call of toolCalls) {
      console.log(`   🔧 ${call.tool} ${JSON.stringify(call.args)}`);
    }

    res.json({ question, answer: lastText(result.messages), toolCalls });
  } catch (err) {
    console.error("Agent error:", err);
    res
      .status(500)
      .json({ error: "The agent could not answer", detail: err.message });
  }
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// 2. Clean shutdown: stop the MCP child process
async function shutdown(signal) {
  console.log(`\n${signal} received, closing MongoDB MCP...`);
  server.close();
  await closeMongoMcp();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
