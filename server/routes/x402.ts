import { Router } from 'express';
import { storage } from '../lib/storage.js';
import type { X402Api } from '../types/index.js';

export const x402Router = Router();

// Mock x402 APIs data
const mockApis: X402Api[] = [
  {
    id: 'api_1',
    name: 'OpenAI GPT-4',
    description: 'Access to GPT-4 for advanced language understanding and generation tasks',
    provider: 'OpenAI',
    price: 0.03,
    currency: 'USDC',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    category: 'AI/ML',
    tags: ['ai', 'nlp', 'gpt', 'language'],
    rating: 4.8,
    callCount: 12500,
  },
  {
    id: 'api_2',
    name: 'Anthropic Claude',
    description: 'Claude AI for safe and helpful AI assistance',
    provider: 'Anthropic',
    price: 0.025,
    currency: 'USDC',
    endpoint: 'https://api.anthropic.com/v1/messages',
    category: 'AI/ML',
    tags: ['ai', 'claude', 'assistant', 'safety'],
    rating: 4.9,
    callCount: 8900,
  },
  {
    id: 'api_3',
    name: 'CoinGecko Price Data',
    description: 'Real-time cryptocurrency prices and market data',
    provider: 'CoinGecko',
    price: 0.001,
    currency: 'USDC',
    endpoint: 'https://api.coingecko.com/api/v3/simple/price',
    category: 'Finance',
    tags: ['crypto', 'prices', 'market-data', 'defi'],
    rating: 4.7,
    callCount: 45000,
  },
  {
    id: 'api_4',
    name: 'Etherscan API',
    description: 'Ethereum blockchain data and transaction history',
    provider: 'Etherscan',
    price: 0.002,
    currency: 'USDC',
    endpoint: 'https://api.etherscan.io/api',
    category: 'Blockchain',
    tags: ['ethereum', 'blockchain', 'transactions', 'explorer'],
    rating: 4.6,
    callCount: 32000,
  },
  {
    id: 'api_5',
    name: 'IPFS Gateway',
    description: 'Decentralized file storage and retrieval via IPFS',
    provider: 'IPFS Network',
    price: 0.0005,
    currency: 'USDC',
    endpoint: 'https://ipfs.io/ipfs/',
    category: 'Storage',
    tags: ['ipfs', 'storage', 'decentralized', 'files'],
    rating: 4.5,
    callCount: 18000,
  },
  {
    id: 'api_6',
    name: 'The Graph Indexer',
    description: 'Query indexed blockchain data with GraphQL',
    provider: 'The Graph',
    price: 0.0015,
    currency: 'USDC',
    endpoint: 'https://api.thegraph.com/subgraphs/name/',
    category: 'Blockchain',
    tags: ['graphql', 'indexing', 'query', 'subgraph'],
    rating: 4.7,
    callCount: 25000,
  },
  {
    id: 'api_7',
    name: 'Twilio SMS',
    description: 'Send SMS messages programmatically',
    provider: 'Twilio',
    price: 0.0075,
    currency: 'USDC',
    endpoint: 'https://api.twilio.com/2010-04-01/Accounts/',
    category: 'Communication',
    tags: ['sms', 'messaging', 'notifications', 'communication'],
    rating: 4.8,
    callCount: 15000,
  },
  {
    id: 'api_8',
    name: 'Stripe Payment Processing',
    description: 'Process credit card payments securely',
    provider: 'Stripe',
    price: 0.029,
    currency: 'USDC',
    endpoint: 'https://api.stripe.com/v1/charges',
    category: 'Finance',
    tags: ['payments', 'credit-cards', 'ecommerce', 'stripe'],
    rating: 4.9,
    callCount: 95000,
  },
  {
    id: 'api_9',
    name: 'AWS Lambda Invoke',
    description: 'Execute serverless functions on demand',
    provider: 'AWS',
    price: 0.0002,
    currency: 'USDC',
    endpoint: 'https://lambda.us-east-1.amazonaws.com/2015-03-31/functions/',
    category: 'Compute',
    tags: ['serverless', 'lambda', 'aws', 'compute'],
    rating: 4.6,
    callCount: 120000,
  },
  {
    id: 'api_10',
    name: 'Chainlink Price Feeds',
    description: 'Decentralized price oracles for DeFi applications',
    provider: 'Chainlink',
    price: 0.001,
    currency: 'USDC',
    endpoint: 'https://data.chain.link/feeds/',
    category: 'Blockchain',
    tags: ['oracle', 'defi', 'prices', 'chainlink'],
    rating: 4.8,
    callCount: 75000,
  },
];

// Initialize mock data
mockApis.forEach(api => storage.saveX402Api(api));

// Get all x402 APIs
x402Router.get('/', (req, res) => {
  const apis = storage.getAllX402Apis();
  res.json(apis);
});

// Get a specific API
x402Router.get('/:id', (req, res) => {
  const api = storage.getX402Api(req.params.id);
  if (!api) {
    return res.status(404).json({ error: 'API not found' });
  }
  res.json(api);
});

// Search APIs
x402Router.get('/search', (req, res) => {
  const query = (req.query.q as string)?.toLowerCase() || '';
  const apis = storage.getAllX402Apis();
  
  const filtered = apis.filter(api =>
    api.name.toLowerCase().includes(query) ||
    api.description.toLowerCase().includes(query) ||
    api.category.toLowerCase().includes(query) ||
    api.tags.some(tag => tag.toLowerCase().includes(query))
  );
  
  res.json(filtered);
});

// Call an API (simulate API call)
x402Router.post('/:id/call', async (req, res) => {
  const { walletId } = req.body;
  const api = storage.getX402Api(req.params.id);
  
  if (!api) {
    return res.status(404).json({ error: 'API not found' });
  }
  
  if (!walletId) {
    return res.status(400).json({ error: 'walletId is required' });
  }
  
  // Simulate API call with random latency
  const latency = Math.floor(Math.random() * 200) + 50; // 50-250ms
  
  // Simulate different responses based on API type
  let mockData: unknown;
  switch (api.category) {
    case 'AI/ML':
      mockData = {
        response: 'This is a simulated AI response',
        tokens: Math.floor(Math.random() * 1000) + 100,
        model: api.name.includes('GPT') ? 'gpt-4' : 'claude-3',
      };
      break;
    case 'Finance':
      mockData = {
        price: (Math.random() * 50000 + 20000).toFixed(2),
        currency: 'USD',
        timestamp: new Date().toISOString(),
      };
      break;
    case 'Blockchain':
      mockData = {
        blockNumber: Math.floor(Math.random() * 20000000),
        transactionHash: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        status: 'success',
      };
      break;
    default:
      mockData = {
        success: true,
        message: 'API call completed successfully',
        timestamp: new Date().toISOString(),
      };
  }
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, latency));
  
  res.json({
    data: mockData,
    latency,
  });
});
