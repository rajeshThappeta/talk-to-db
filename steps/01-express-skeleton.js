import express from 'express';

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/ask', async (req, res) => {
  const { question } = req.body ?? {};

  if (typeof question !== 'string' || !question.trim()) {
    return res.status(400).json({ error: 'question (non-empty string) is required' });
  }

  // Step 2+: the agent will answer here
  res.json({ question, answer: 'stub: agent not connected yet' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});