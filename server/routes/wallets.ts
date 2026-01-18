import { Router } from 'express';
import { storage } from '../lib/storage.js';
import { callMcpTool } from '../lib/mcp-client.js';
import { getArcBalance, getUnifiedArcBalance } from '../lib/arc-balance.js';
import type { Wallet } from '../types/index.js';

export const walletsRouter = Router();

// Get all wallets
walletsRouter.get('/', async (req, res) => {
  try {
    // Get wallet addresses from query parameter (from Privy)
    // Express handles array query params as either array or single value
    let walletAddresses: string[] = [];
    if (req.query.addresses) {
      if (Array.isArray(req.query.addresses)) {
        walletAddresses = req.query.addresses as string[];
      } else {
        walletAddresses = [req.query.addresses as string];
      }
    }
    
    if (walletAddresses.length > 0) {
      // Fetch wallets from ARC network
      const wallets: Wallet[] = await Promise.all(
        walletAddresses.map(async (address) => {
          // Validate address format
          if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
            return null;
          }
          
          const balance = await getArcBalance(address);
          const usdcToken = balance?.tokens.find(t => t.currency === 'USDC');
          return {
            id: address,
            name: 'Privy Wallet',
            address: address,
            chain: 'arc-testnet' as Wallet['chain'],
            balance: {
              usdc: parseFloat(usdcToken?.amount || balance?.native.amount || '0'),
              native: parseFloat(balance?.native.amount || '0'),
            },
            status: 'active' as const,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        })
      );
      
      // Filter out null values (invalid addresses)
      const validWallets = wallets.filter((w): w is Wallet => w !== null);
      return res.json(validWallets);
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

// Get unified balance across all chains (ARC Network)
walletsRouter.get('/balance/unified', async (req, res) => {
  try {
    // Get wallet addresses from query parameter (from Privy)
    let walletAddresses: string[] = [];
    if (req.query.addresses) {
      if (Array.isArray(req.query.addresses)) {
        walletAddresses = req.query.addresses as string[];
      } else {
        walletAddresses = [req.query.addresses as string];
      }
    }
    
    // Filter valid addresses
    walletAddresses = walletAddresses.filter(addr => addr && addr.match(/^0x[a-fA-F0-9]{40}$/));
    
    if (walletAddresses.length > 0) {
      const result = await getUnifiedArcBalance(walletAddresses);
      return res.json(result);
    }
    
    // Try MCP tool as fallback
    const result = await callMcpTool('unified_balance', {});
    if (result.success && result.data) {
      return res.json(result.data);
    }
  } catch (error) {
    console.error('Failed to get unified balance:', error);
  }
  
  // Fallback: return zero balance
  res.json({ total: 0, by_chain: {} });
});

// Get wallet balance from ARC Network
walletsRouter.get('/:id/balance', async (req, res) => {
  const walletAddress = req.params.id;
  
  // Validate address format
  if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
    return res.status(400).json({ error: 'Invalid wallet address format' });
  }
  
  try {
    const balance = await getArcBalance(walletAddress);
    if (balance) {
      return res.json({
        walletId: walletAddress,
        chain: 'arc-testnet',
        native: balance.native,
        tokens: balance.tokens,
      });
    }
  } catch (error) {
    console.error('Failed to get balance from ARC network:', error);
  }
  
  // Fallback: return zero balance
  res.json({
    walletId: walletAddress,
    chain: 'arc-testnet',
    native: { amount: '0', currency: 'USDC' },
    tokens: [{ tokenAddress: 'native', amount: '0', currency: 'USDC' }],
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
