import express from 'express';
import cors from 'cors';
import { paymentsRouter } from './routes/payments.js';
import { mcpRouter } from './routes/mcp.js';
import { guardsRouter } from './routes/guards.js';
import { transactionsRouter } from './routes/transactions.js';
import { crosschainRouter } from './routes/crosschain.js';
import { walletsRouter } from './routes/wallets.js';
import { workspacesRouter } from './routes/workspaces.js';
import { agentsRouter } from './routes/agents.js';
import { ledgerRouter } from './routes/ledger.js';
import { x402Router } from './routes/x402.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:5173', 'http://127.0.0.1:8080'],
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/payments', paymentsRouter);
app.use('/api/intents', paymentsRouter); // Alias for payments
app.use('/api/mcp', mcpRouter);
app.use('/api/guards', guardsRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/crosschain', crosschainRouter);
app.use('/api/wallets', walletsRouter);
app.use('/api/workspaces', workspacesRouter);
app.use('/api/agents', agentsRouter);
app.use('/api/ledger', ledgerRouter);
app.use('/api/x402', x402Router);

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
});
