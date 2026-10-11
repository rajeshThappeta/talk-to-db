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

  // 1. List collections in sample_mflix
  const collections = await client.callTool({
    name: 'list-collections',
    arguments: { connectionId: 'preconfigured', database: 'sample_mflix' },
  });
  printResult('list-collections', collections);

  // 2. Count movies released in 1999
  const count = await client.callTool({
    name: 'count',
    arguments: {
      connectionId: 'preconfigured',
      database: 'sample_mflix',
      collection: 'movies',
      query: { year: 1999 },
    },
  });
  printResult('count (movies, year 1999)', count);
} finally {
  await client.close();
}

function printResult(label, result) {
  console.log(`\n--- ${label} ${result.isError ? '❌ ERROR' : ''}`);
  for (const block of result.content) {
    if (block.type === 'text') console.log(block.text);
  }
}