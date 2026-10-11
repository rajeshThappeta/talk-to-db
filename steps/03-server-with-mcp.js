import express from 'express';
import { getMongoTools, closeMongoMcp } from './mcp/mongodb.js';

if (!process.env.MONGO_URI) {
  console.error('MONGO_URI is missing in .env');
  process.exit(1);
}

// 1. Start the MCP server and load its tools ONCE, before accepting requests
const tools = await getMongoTools();
console.log(`🔌 MongoDB MCP: ${tools.length} tools loaded`);
for (const tool of tools) console.log(`   - ${tool.name}`);

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', tools: tools.length });
});

app.post('/api/ask', async (req, res) => {
  const { question } = req.body ?? {};

  if (typeof question !== 'string' || !question.trim()) {
    return res.status(400).json({ error: 'question (non-empty string) is required' });
  }

  // Step 4: the agent will answer here using `tools`
  res.json({ question, answer: 'stub: agent not connected yet' });
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
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);