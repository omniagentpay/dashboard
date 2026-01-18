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
import { invoiceRouter } from './routes/invoice.js';
import { receiptsRouter } from './routes/receipts.js';
import { pluginsRouter } from './routes/plugins.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
// Enhanced CORS configuration - permissive for development
const isDevelopment = process.env.NODE_ENV !== 'production';

// Allowed origins list
const allowedOrigins = [
  'http://localhost:8080',
  'http://localhost:5173',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:5173',
];

// CORS configuration - allow all origins in development
app.use(cors({
  origin: function (origin, callback) {
    // In development, allow all origins (including null for same-origin requests)
    if (isDevelopment) {
      return callback(null, true);
    }
    
    // In production, only allow specific origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Handle preflight requests explicitly - must be before other routes
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  if (isDevelopment || !origin || allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS, HEAD');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400'); // 24 hours
    res.sendStatus(204);
  } else {
    res.sendStatus(403);
  }
});

// Request logging middleware (for debugging)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${req.headers.origin || 'none'}`);
  next();
});

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
app.use('/api/invoice', invoiceRouter);
app.use('/api/receipts', receiptsRouter);
app.use('/api/plugins', pluginsRouter);
app.use('/api/webhooks', pluginsRouter); // Webhooks are part of plugins router

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
});
