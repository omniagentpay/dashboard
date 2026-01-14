import { Router } from 'express';
import { storage } from '../lib/storage.js';
import { callMcpTool } from '../lib/mcp-client.js';
import type { Wallet } from '../types/index.js';

export const walletsRouter = Router();

// Get all wallets
walletsRouter.get('/', async (req, res) => {
  // Try to get wallets from MCP/SDK, fallback to storage
  try {
    const result = await callMcpTool('unified_balance', {});
    if (result.success && result.data) {
      // TODO: Map MCP response to wallet format
      // For now, return stored wallets
    }
  } catch (error) {
    console.error('Failed to fetch wallets from MCP:', error);
  }
  
  const wallets = storage.getAllWallets();
  res.json(wallets);
});

// Get a specific wallet
walletsRouter.get('/:id', async (req, res) => {
  const wallet = storage.getWallet(req.params.id);
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
