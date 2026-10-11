import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';

if (!process.env.MONGO_URI) {
  console.error('MONGO_URI is missing in .env');
  process.exit(1);
}

const client = new Client({ name: 'talk-to-db', version: '1.0.0' });

const transport = new StdioClientTransport({
  command: 'npx',
  args: ['mongodb-mcp-server', '--readOnly'],
  env: {
    ...process.env,
    MDB_MCP_CONNECTION_STRING: process.env.MONGO_URI,
  },
});

try {
  await client.connect(transport);
  console.log('✅ Connected to MongoDB MCP server');

  const { tools } = await client.listTools();
  console.log(`\n${tools.length} tools available:`);
  for (const tool of tools) {
    console.log(`- ${tool.name}`);
  }

  const find = tools.find((t) => t.name === 'find');
  console.log('\n"find" tool input schema:');
  console.log(JSON.stringify(find?.inputSchema, null, 2));
} finally {
  await client.close();
}