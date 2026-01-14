import { Router } from 'express';
import { storage } from '../lib/storage.js';
import { checkGuards } from '../lib/guards.js';
import type { GuardConfig, BlastRadius } from '../types/index.js';

export const guardsRouter = Router();

// Get all guards
guardsRouter.get('/', (req, res) => {
  const guards = storage.getAllGuards();
  res.json(guards);
});

// Get a specific guard
guardsRouter.get('/:id', (req, res) => {
  const guard = storage.getGuard(req.params.id);
  if (!guard) {
    return res.status(404).json({ error: 'Guard not found' });
  }
  res.json(guard);
});

// Update a guard
guardsRouter.patch('/:id', (req, res) => {
  const guard = storage.getGuard(req.params.id);
  if (!guard) {
    return res.status(404).json({ error: 'Guard not found' });
  }
  
  const updates = req.body;
  const updatedGuard: GuardConfig = {
    ...guard,
    ...updates,
    config: { ...guard.config, ...updates.config },
  };
  
  storage.saveGuard(updatedGuard);
  res.json(updatedGuard);
});

// Simulate guard policy
guardsRouter.post('/simulate', async (req, res) => {
  const { amount, recipient } = req.body;
  
  if (typeof amount !== 'number') {
    return res.status(400).json({ error: 'Amount is required' });
  }
  
  // Create a temporary intent for simulation
  const tempIntent: any = {
    id: 'temp',
    amount,
    recipient: recipient || 'unknown',
    recipientAddress: recipient || 'unknown',
    currency: 'USDC',
    walletId: 'temp',
    chain: 'ethereum',
    status: 'pending',
    steps: [],
    guardResults: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  const guardResults = await checkGuards(tempIntent);
  const passed = guardResults.every(r => r.passed);
  
  res.json({
    passed,
    results: guardResults.map(r => ({
      guard: r.guardName,
      passed: r.passed,
      reason: r.reason,
    })),
  });
});

// Get blast radius for guard changes
guardsRouter.get('/blast-radius', (req, res) => {
  const { guardId } = req.query;
  
  const guard = guardId ? storage.getGuard(guardId as string) : null;
  const agents = storage.getAllAgents();
  const intents = storage.getAllPaymentIntents();
  
  // Calculate affected agents (mock logic)
  const affectedAgents = agents.slice(0, 3).map(agent => ({
    agentId: agent.id,
    agentName: agent.name,
    impact: (['high', 'medium', 'low'] as const)[Math.floor(Math.random() * 3)],
  }));
  
  // Calculate affected tools (mock)
  const toolUsage = new Map<string, number>();
  intents.forEach(intent => {
    if (intent.contract?.mcpToolInvoked) {
      const toolName = intent.contract.mcpToolInvoked.toolName;
      toolUsage.set(toolName, (toolUsage.get(toolName) || 0) + 1);
    }
  });
  
  const affectedTools = Array.from(toolUsage.entries()).map(([toolName, count]) => ({
    toolId: `tool_${toolName}`,
    toolName,
    usageCount: count,
  }));
  
  // Calculate daily exposure
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTxs = intents.filter(i => {
    const date = new Date(i.createdAt);
    return date >= today && i.status === 'succeeded';
  });
  const currentDailySpend = todayTxs.reduce((sum, i) => sum + i.amount, 0);
  const estimatedDailyExposure = guard?.config.limit || 3000;
  
  const blastRadius: BlastRadius = {
    affectedAgents,
    affectedTools,
    estimatedDailyExposure,
    currentDailySpend,
  };
  
  res.json(blastRadius);
});
