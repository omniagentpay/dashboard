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
// Enhanced CORS configuration - permissive for development
const isDevelopment = process.env.NODE_ENV !== 'production';

app.use(cors({
  origin: function (origin, callback) {
    // In development, allow all origins for easier debugging
    if (isDevelopment) {
      return callback(null, true);
    }
    
    // In production, only allow specific origins
    const allowedOrigins = [
      'http://localhost:8080',
      'http://localhost:5173',
      'http://127.0.0.1:8080',
      'http://127.0.0.1:5173',
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
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

// Handle preflight requests explicitly
app.options('*', cors());

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

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
});
