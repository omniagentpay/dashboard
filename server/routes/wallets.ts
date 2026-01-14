import { Router } from 'express';
import { storage } from '../lib/storage.js';
import { callMcpTool } from '../lib/mcp-client.js';
import { getCircleWalletClient } from '../lib/circle-wallet.js';
import type { Wallet } from '../types/index.js';

export const walletsRouter = Router();

// Get all wallets
walletsRouter.get('/', async (req, res) => {
  try {
    // Try Circle Wallet SDK first (read-only)
    const circleClient = getCircleWalletClient();
    if (circleClient.isAvailable()) {
      try {
        const circleWallets = await circleClient.listWallets();
        if (circleWallets.length > 0) {
          // Map Circle wallets to our format
          const wallets: Wallet[] = await Promise.all(
            circleWallets.map(async (cw) => {
              const balance = await circleClient.getBalance(cw.walletId);
              return {
                id: cw.walletId,
                name: cw.description || `Agent Wallet (Circle Custody)`,
                address: cw.walletId, // Circle uses wallet IDs, not addresses
                chain: (balance?.chain || 'ethereum') as Wallet['chain'],
                balance: {
                  usdc: parseFloat(balance?.tokens.find(t => t.currency === 'USDC')?.amount || '0'),
                  native: parseFloat(balance?.native.amount || '0'),
                },
                status: cw.state === 'ACTIVE' ? 'active' : 'inactive',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
            })
          );
          return res.json(wallets);
        }
      } catch (error) {
        console.error('Failed to fetch wallets from Circle SDK:', error);
        // Fall through to storage fallback
      }
    }
  } catch (error) {
    console.error('Error in wallet fetch:', error);
  }
  
  // Fallback to storage
  const wallets = storage.getAllWallets();
  res.json(wallets);
});

// Get a specific wallet
walletsRouter.get('/:id', async (req, res) => {
  const walletId = req.params.id;
  
  // Try Circle Wallet SDK first
  const circleClient = getCircleWalletClient();
  if (circleClient.isAvailable() && walletId.startsWith('wallet_circle_')) {
    try {
      const circleWallet = await circleClient.getWallet(walletId);
      if (circleWallet) {
        const balance = await circleClient.getBalance(walletId);
        const wallet: Wallet = {
          id: circleWallet.walletId,
          name: circleWallet.description || 'Agent Wallet (Circle Custody)',
          address: circleWallet.walletId,
          chain: (balance?.chain || 'ethereum') as Wallet['chain'],
          balance: {
            usdc: parseFloat(balance?.tokens.find(t => t.currency === 'USDC')?.amount || '0'),
            native: parseFloat(balance?.native.amount || '0'),
          },
          status: circleWallet.state === 'ACTIVE' ? 'active' : 'inactive',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return res.json(wallet);
      }
    } catch (error) {
      console.error('Failed to fetch wallet from Circle SDK:', error);
      // Fall through to storage
    }
  }
  
  // Fallback to storage
  const wallet = storage.getWallet(walletId);
  if (!wallet) {
    return res.status(404).json({ error: 'Wallet not found' });
  }
  
  // Try to refresh balance from MCP
  try {
    const result = await callMcpTool('check_balance', {
      wallet_id: wallet.id,
      chain: wallet.chain,
    });
    
    if (result.success && result.data) {
      const data = result.data as any;
      if (data.balance) {
        wallet.balance = {
          usdc: data.balance.usdc || wallet.balance.usdc,
          native: data.balance.native || wallet.balance.native,
        };
        wallet.updatedAt = new Date().toISOString();
        storage.saveWallet(wallet);
      }
    }
  } catch (error) {
    console.error('Failed to refresh wallet balance:', error);
  }
  
  res.json(wallet);
});

// Create a new wallet
walletsRouter.post('/', async (req, res) => {
  const { name, chain, address } = req.body;
  
  if (!name || !chain) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  // Validate address format if provided
  if (address && !address.match(/^0x[a-fA-F0-9]{40}$/)) {
    return res.status(400).json({ error: 'Invalid wallet address format' });
  }
  
  // Use provided address or generate a new one
  let walletAddress: string;
  if (address) {
    walletAddress = address;
  } else {
    // Generate a placeholder address (in production, this would call SDK to create wallet)
    walletAddress = `0x${Math.random().toString(16).slice(2, 10)}${Math.random().toString(16).slice(2, 10)}${Math.random().toString(16).slice(2, 10)}${Math.random().toString(16).slice(2, 10)}`;
  }
  
  const wallet: Wallet = {
    id: `wallet_${Date.now()}`,
    name,
    address: walletAddress,
    chain: chain as Wallet['chain'],
    balance: { usdc: 0, native: 0 },
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  storage.saveWallet(wallet);
  res.status(201).json(wallet);
});

// Get unified balance across all chains
walletsRouter.get('/balance/unified', async (req, res) => {
  try {
    const result = await callMcpTool('unified_balance', {});
    if (result.success && result.data) {
      return res.json(result.data);
    }
  } catch (error) {
    console.error('Failed to get unified balance:', error);
  }
  
  // Try Circle Wallet SDK
  const circleClient = getCircleWalletClient();
  if (circleClient.isAvailable()) {
    try {
      const circleWallets = await circleClient.listWallets();
      const byChain: Record<string, number> = {};
      let total = 0;
      
      for (const cw of circleWallets) {
        const balance = await circleClient.getBalance(cw.walletId);
        if (balance) {
          const chain = balance.chain;
          const usdcAmount = parseFloat(balance.tokens.find(t => t.currency === 'USDC')?.amount || '0');
          byChain[chain] = (byChain[chain] || 0) + usdcAmount;
          total += usdcAmount;
        }
      }
      
      if (total > 0) {
        return res.json({ total, by_chain: byChain });
      }
    } catch (error) {
      console.error('Failed to get balance from Circle SDK:', error);
    }
  }
  
  // Fallback: calculate from stored wallets
  const wallets = storage.getAllWallets();
  const byChain: Record<string, number> = {};
  let total = 0;
  
  for (const wallet of wallets) {
    byChain[wallet.chain] = (byChain[wallet.chain] || 0) + wallet.balance.usdc;
    total += wallet.balance.usdc;
  }
  
  res.json({ total, by_chain: byChain });
});

// Get wallet balance (Circle SDK endpoint)
walletsRouter.get('/:id/balance', async (req, res) => {
  const walletId = req.params.id;
  
  const circleClient = getCircleWalletClient();
  if (circleClient.isAvailable() && walletId.startsWith('wallet_circle_')) {
    try {
      const balance = await circleClient.getBalance(walletId);
      if (balance) {
        return res.json({
          walletId: balance.walletId,
          chain: balance.chain,
          native: balance.native,
          tokens: balance.tokens,
        });
      }
    } catch (error) {
      console.error('Failed to get balance from Circle SDK:', error);
    }
  }
  
  // Fallback to storage
  const wallet = storage.getWallet(walletId);
  if (!wallet) {
    return res.status(404).json({ error: 'Wallet not found' });
  }
  
  res.json({
    walletId: wallet.id,
    chain: wallet.chain,
    native: { amount: wallet.balance.native.toString(), currency: wallet.chain === 'ethereum' ? 'ETH' : 'MATIC' },
    tokens: [{ tokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', amount: wallet.balance.usdc.toString(), currency: 'USDC' }],
  });
});

// Get supported networks
walletsRouter.get('/:id/networks', async (req, res) => {
  const circleClient = getCircleWalletClient();
  if (circleClient.isAvailable()) {
    try {
      const networks = await circleClient.getSupportedNetworks();
      return res.json({ networks });
    } catch (error) {
      console.error('Failed to get networks from Circle SDK:', error);
    }
  }
  
  // Fallback
  res.json({ networks: ['ethereum', 'polygon', 'arbitrum', 'optimism', 'base', 'avalanche'] });
});

// Initialize/Connect Circle Wallet
walletsRouter.post('/circle/initialize', async (req, res) => {
  try {
    const { description } = req.body;
    const circleClient = getCircleWalletClient();
    
    if (!circleClient.isAvailable()) {
      return res.status(503).json({ error: 'Circle Wallet SDK is not available' });
    }
    
    const circleWallet = await circleClient.initializeWallet(description);
    const balance = await circleClient.getBalance(circleWallet.walletId);
    
    // Map to our wallet format
    const wallet: Wallet = {
      id: circleWallet.walletId,
      name: circleWallet.description || 'Agent Wallet (Circle Custody)',
      address: circleWallet.walletId, // Circle uses wallet IDs
      chain: (balance?.chain || 'ethereum') as Wallet['chain'],
      balance: {
        usdc: parseFloat(balance?.tokens.find(t => t.currency === 'USDC')?.amount || '0'),
        native: parseFloat(balance?.native.amount || '0'),
      },
      status: circleWallet.state === 'ACTIVE' ? 'active' : 'inactive',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Also save to storage for consistency
    storage.saveWallet(wallet);
    
    res.status(201).json(wallet);
  } catch (error) {
    console.error('Failed to initialize Circle wallet:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to initialize Circle wallet' 
    });
  }
});
