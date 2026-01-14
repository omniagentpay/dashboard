import { Router } from 'express';
import { storage } from '../lib/storage.js';
import { checkGuards, requiresApproval } from '../lib/guards.js';
import { simulatePayment, executePayment } from '../lib/sdk-client.js';
import type { 
  PaymentIntent, 
  PaymentStep, 
  TimelineEvent, 
  PaymentExplanation,
  WhatIfSimulationParams,
  WhatIfSimulationResult,
  IncidentReplayResult,
  McpSdkContract,
} from '../types/index.js';

export const paymentsRouter = Router();

// Get all payment intents
paymentsRouter.get('/', (req, res) => {
  const intents = storage.getAllPaymentIntents();
  res.json(intents);
});

// Get a specific payment intent
paymentsRouter.get('/:id', (req, res) => {
  const intent = storage.getPaymentIntent(req.params.id);
  if (!intent) {
    return res.status(404).json({ error: 'Payment intent not found' });
  }
  res.json(intent);
});

// Create a new payment intent
paymentsRouter.post('/', async (req, res) => {
  const { amount, recipient, recipientAddress, description, walletId, chain } = req.body;
  
  if (!amount || !recipient || !recipientAddress || !walletId || !chain) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  // Get or create a default agent
  const agents = storage.getAllAgents();
  const defaultAgent = agents.length > 0 ? agents[0] : null;
  
  const intent: PaymentIntent = {
    id: `pi_${Date.now()}`,
    amount: parseFloat(amount),
    currency: 'USDC',
    recipient,
    recipientAddress,
    description: description || '',
    status: 'pending',
    walletId,
    chain: chain as PaymentIntent['chain'],
    steps: [
      { id: 's1', name: 'Simulation', status: 'pending' },
      { id: 's2', name: 'Approval', status: 'pending' },
      { id: 's3', name: 'Execution', status: 'pending' },
      { id: 's4', name: 'Confirmation', status: 'pending' },
    ],
    guardResults: [],
    agentId: defaultAgent?.id,
    agentName: defaultAgent?.name,
    contract: {
      backendApiCall: {
        method: 'POST',
        endpoint: `/api/payments`,
        payload: { amount, recipient, recipientAddress, description, walletId, chain },
      },
      mcpToolInvoked: {
        toolName: 'create_payment_intent',
        toolId: 'mcp_tool_payment',
        input: { amount: parseFloat(amount), recipient, chain },
      },
      sdkMethodCalled: {
        method: 'simulate',
        params: { amount: parseFloat(amount), recipientAddress, chain },
      },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  storage.savePaymentIntent(intent);
  res.status(201).json(intent);
});

// Simulate a payment intent
paymentsRouter.post('/:id/simulate', async (req, res) => {
  const intent = storage.getPaymentIntent(req.params.id);
  if (!intent) {
    return res.status(404).json({ error: 'Payment intent not found' });
  }
  
  // Update status
  intent.status = 'simulating';
  intent.steps[0].status = 'in_progress';
  intent.updatedAt = new Date().toISOString();
  storage.savePaymentIntent(intent);
  
  try {
    // Call SDK to simulate
    const simulateResult = await simulatePayment({
      amount: intent.amount,
      recipient: intent.recipient,
      recipientAddress: intent.recipientAddress,
      walletId: intent.walletId,
      chain: intent.chain,
    });
    
    // Check guards
    const guardResults = await checkGuards(intent);
    intent.guardResults = guardResults;
    
    // Update steps
    intent.steps[0].status = 'completed';
    intent.steps[0].timestamp = new Date().toISOString();
    
    // Determine if approval is needed
    const needsApproval = requiresApproval(intent, guardResults);
    const allGuardsPassed = guardResults.every(r => r.passed);
    
    if (!allGuardsPassed) {
      intent.status = 'blocked';
      intent.steps[1].status = 'failed';
      intent.steps[1].details = 'Blocked by guard checks';
    } else if (needsApproval) {
      intent.status = 'awaiting_approval';
      intent.steps[1].status = 'in_progress';
    } else {
      // Auto-approve if below threshold
      intent.status = 'awaiting_approval';
      intent.steps[1].status = 'completed';
      intent.steps[1].timestamp = new Date().toISOString();
    }
    
    intent.route = simulateResult.route;
    intent.updatedAt = new Date().toISOString();
    storage.savePaymentIntent(intent);
    
    res.json({
      success: true,
      estimatedFee: simulateResult.estimatedFee,
      guardResults: intent.guardResults,
      route: intent.route,
      requiresApproval: needsApproval,
    });
  } catch (error) {
    intent.status = 'failed';
    intent.steps[0].status = 'failed';
    intent.steps[0].details = error instanceof Error ? error.message : 'Simulation failed';
    intent.updatedAt = new Date().toISOString();
    storage.savePaymentIntent(intent);
    
    res.status(500).json({ error: 'Simulation failed', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Approve a payment intent
paymentsRouter.post('/:id/approve', async (req, res) => {
  const intent = storage.getPaymentIntent(req.params.id);
  if (!intent) {
    return res.status(404).json({ error: 'Payment intent not found' });
  }
  
  if (intent.status !== 'awaiting_approval') {
    return res.status(400).json({ error: 'Intent is not awaiting approval' });
  }
  
  intent.steps[1].status = 'completed';
  intent.steps[1].timestamp = new Date().toISOString();
  intent.status = 'executing';
  intent.steps[2].status = 'in_progress';
  intent.updatedAt = new Date().toISOString();
  storage.savePaymentIntent(intent);
  
  res.json({ success: true, intent });
});

// Execute a payment intent
paymentsRouter.post('/:id/execute', async (req, res) => {
  const intent = storage.getPaymentIntent(req.params.id);
  if (!intent) {
    return res.status(404).json({ error: 'Payment intent not found' });
  }
  
  if (intent.status !== 'executing' && intent.status !== 'awaiting_approval') {
    return res.status(400).json({ error: 'Intent is not ready for execution' });
  }
  
  // If not already executing, update status
  if (intent.status === 'awaiting_approval') {
    intent.steps[1].status = 'completed';
    intent.steps[1].timestamp = new Date().toISOString();
    intent.status = 'executing';
    intent.steps[2].status = 'in_progress';
  }
  
  intent.updatedAt = new Date().toISOString();
  storage.savePaymentIntent(intent);
  
  try {
    // Call SDK to execute payment
    const executeResult = await executePayment(intent.id);
    
    if (executeResult.success && executeResult.txHash) {
      intent.txHash = executeResult.txHash;
      intent.steps[2].status = 'completed';
      intent.steps[2].timestamp = new Date().toISOString();
      intent.steps[3].status = 'completed';
      intent.steps[3].timestamp = new Date().toISOString();
      intent.status = 'succeeded';
      intent.updatedAt = new Date().toISOString();
      storage.savePaymentIntent(intent);
      
      // Create transaction record
      const transaction = {
        id: `tx_${Date.now()}`,
        intentId: intent.id,
        walletId: intent.walletId,
        type: 'payment' as const,
        amount: intent.amount,
        currency: intent.currency,
        recipient: intent.recipient,
        recipientAddress: intent.recipientAddress,
        status: 'succeeded' as const,
        chain: intent.chain,
        txHash: executeResult.txHash,
        fee: 0.5, // TODO: Get actual fee from SDK
        createdAt: new Date().toISOString(),
      };
      storage.saveTransaction(transaction);
      
      res.json({ success: true, txHash: executeResult.txHash, intent });
    } else {
      intent.status = 'failed';
      intent.steps[2].status = 'failed';
      intent.steps[2].details = executeResult.error || 'Execution failed';
      intent.updatedAt = new Date().toISOString();
      storage.savePaymentIntent(intent);
      
      res.status(500).json({ error: 'Execution failed', details: executeResult.error });
    }
  } catch (error) {
    intent.status = 'failed';
    intent.steps[2].status = 'failed';
    intent.steps[2].details = error instanceof Error ? error.message : 'Execution failed';
    intent.updatedAt = new Date().toISOString();
    storage.savePaymentIntent(intent);
    
    res.status(500).json({ error: 'Execution failed', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Get payment timeline
paymentsRouter.get('/:id/timeline', (req, res) => {
  const intent = storage.getPaymentIntent(req.params.id);
  if (!intent) {
    return res.status(404).json({ error: 'Payment intent not found' });
  }
  
  // Generate timeline from intent data
  const timeline: TimelineEvent[] = [];
  const now = new Date();
  
  if (intent.agentId && intent.agentName) {
    timeline.push({
      id: 'tl_1',
      type: 'agent_action',
      timestamp: intent.createdAt,
      title: 'Agent initiated payment',
      description: `${intent.agentName} initiated a payment request`,
      status: 'success',
      details: {
        agentId: intent.agentId,
        agentName: intent.agentName,
      },
    });
  }
  
  if (intent.contract?.mcpToolInvoked) {
    timeline.push({
      id: 'tl_2',
      type: 'tool_invocation',
      timestamp: intent.createdAt,
      title: 'Tool invoked',
      description: `MCP tool ${intent.contract.mcpToolInvoked.toolName} was invoked`,
      status: 'success',
      details: {
        toolName: intent.contract.mcpToolInvoked.toolName,
        toolInput: intent.contract.mcpToolInvoked.input,
        toolOutput: intent.contract.mcpToolInvoked.output,
      },
    });
  }
  
  const simulateStep = intent.steps.find(s => s.name === 'Simulation');
  if (simulateStep && simulateStep.status !== 'pending') {
    timeline.push({
      id: 'tl_3',
      type: 'simulate',
      timestamp: simulateStep.timestamp || intent.createdAt,
      title: 'Payment simulation',
      description: 'Simulated payment execution',
      status: simulateStep.status === 'completed' ? 'success' : simulateStep.status === 'failed' ? 'failed' : 'pending',
      details: {
        route: intent.route,
        estimatedFee: 0.5,
      },
    });
  }
  
  if (intent.guardResults.length > 0) {
    intent.guardResults.forEach((guard, idx) => {
      timeline.push({
        id: `tl_4_${idx}`,
        type: 'guard_evaluation',
        timestamp: intent.updatedAt,
        title: `Guard: ${guard.guardName}`,
        description: guard.reason || (guard.passed ? 'Guard check passed' : 'Guard check failed'),
        status: guard.passed ? 'success' : 'blocked',
        details: {
          guardId: guard.guardId,
          guardName: guard.guardName,
          guardResult: guard.passed,
          guardReason: guard.reason,
        },
      });
    });
  }
  
  const approvalStep = intent.steps.find(s => s.name === 'Approval');
  if (approvalStep && approvalStep.status !== 'pending') {
    timeline.push({
      id: 'tl_5',
      type: 'approval_decision',
      timestamp: approvalStep.timestamp || intent.updatedAt,
      title: 'Approval decision',
      description: approvalStep.status === 'completed' ? 'Payment approved' : approvalStep.details || 'Awaiting approval',
      status: approvalStep.status === 'completed' ? 'success' : approvalStep.status === 'failed' ? 'blocked' : 'pending',
    });
  }
  
  const executeStep = intent.steps.find(s => s.name === 'Execution');
  if (executeStep && executeStep.status === 'completed' && intent.txHash) {
    timeline.push({
      id: 'tl_6',
      type: 'pay_execution',
      timestamp: executeStep.timestamp || intent.updatedAt,
      title: 'Payment executed',
      description: `Transaction ${intent.txHash.substring(0, 10)}... confirmed`,
      status: 'success',
      details: {
        txHash: intent.txHash,
      },
    });
  }
  
  res.json(timeline);
});

// Get payment explanation
paymentsRouter.get('/:id/explanation', (req, res) => {
  const intent = storage.getPaymentIntent(req.params.id);
  if (!intent) {
    return res.status(404).json({ error: 'Payment intent not found' });
  }
  
  const agent = intent.agentId ? storage.getAgent(intent.agentId) : null;
  const allGuardsPassed = intent.guardResults.every(r => r.passed);
  const blockingGuards = intent.guardResults.filter(r => !r.passed);
  
  const explanation: PaymentExplanation = {
    initiatedBy: {
      agentId: intent.agentId || 'unknown',
      agentName: intent.agentName || agent?.name || 'Unknown Agent',
      toolName: intent.contract?.mcpToolInvoked?.toolName || 'payment_tool',
      toolInput: intent.contract?.mcpToolInvoked?.input || { amount: intent.amount, recipient: intent.recipient },
    },
    reason: intent.description || `Payment of $${intent.amount} to ${intent.recipient}`,
    decision: {
      allowed: allGuardsPassed && intent.status !== 'blocked',
      reason: allGuardsPassed 
        ? 'All guard checks passed' 
        : `Blocked by ${blockingGuards.map(g => g.guardName).join(', ')}`,
      blockingGuards: blockingGuards.map(g => ({
        id: g.guardId,
        name: g.guardName,
        reason: g.reason || 'Guard check failed',
      })),
    },
    route: {
      chosen: intent.route || 'auto',
      explanation: intent.route === 'cctp' 
        ? 'Using Circle CCTP for cross-chain transfer'
        : intent.route === 'gateway'
        ? 'Using Gateway protocol for routing'
        : 'Auto-selected optimal route',
      estimatedTime: '2-5 minutes',
      estimatedFee: 0.5,
    },
    conditions: {
      wouldBlock: [
        {
          condition: 'Amount exceeds single transaction limit',
          currentValue: `$${intent.amount}`,
          threshold: '$2000',
        },
        {
          condition: 'Daily budget exceeded',
          currentValue: '$1500',
          threshold: '$3000',
        },
      ],
    },
  };
  
  res.json(explanation);
});

// What-if simulation
paymentsRouter.post('/simulate', async (req, res) => {
  const { amount, guardPresetId, chain, time }: WhatIfSimulationParams = req.body;
  
  if (!amount) {
    return res.status(400).json({ error: 'Amount is required' });
  }
  
  // Mock simulation logic
  const guards = storage.getAllGuards();
  const guardResults = guards
    .filter(g => g.enabled)
    .map(guard => {
      let passed = true;
      let reason = '';
      
      if (guard.type === 'single_tx' && guard.config.limit && amount > guard.config.limit) {
        passed = false;
        reason = `Amount $${amount} exceeds single transaction limit of $${guard.config.limit}`;
      } else if (guard.type === 'budget') {
        // Mock: check daily budget
        const dailySpent = 1500; // Mock value
        const limit = guard.config.limit || 3000;
        if (dailySpent + amount > limit) {
          passed = false;
          reason = `Payment would exceed daily budget of $${limit}`;
        }
      }
      
      return {
        guardId: guard.id,
        guardName: guard.name,
        passed,
        reason: passed ? 'Guard check passed' : reason,
      };
    });
  
  const allPassed = guardResults.every(r => r.passed);
  
  const result: WhatIfSimulationResult = {
    allowed: allPassed,
    reason: allPassed 
      ? 'All guard checks would pass'
      : `Blocked by: ${guardResults.filter(r => !r.passed).map(r => r.guardName).join(', ')}`,
    guardResults,
    estimatedFee: 0.5,
    route: 'auto',
  };
  
  res.json(result);
});

// Incident replay
paymentsRouter.post('/:id/replay', async (req, res) => {
  const intent = storage.getPaymentIntent(req.params.id);
  if (!intent) {
    return res.status(404).json({ error: 'Payment intent not found' });
  }
  
  // Get original guard results
  const originalResults = intent.guardResults;
  
  // Re-evaluate with current guards
  const currentGuards = storage.getAllGuards();
  const currentResults = await checkGuards(intent);
  
  // Find differences
  const differences = originalResults.map(original => {
    const current = currentResults.find(c => c.guardId === original.guardId);
    return {
      guardId: original.guardId,
      guardName: original.guardName,
      original: original.passed,
      current: current?.passed ?? false,
      reason: current?.passed !== original.passed 
        ? `Guard result changed: was ${original.passed ? 'passed' : 'failed'}, now ${current?.passed ? 'passed' : 'failed'}`
        : 'No change',
    };
  });
  
  const replayResult: IncidentReplayResult = {
    originalResult: {
      allowed: originalResults.every(r => r.passed),
      timestamp: intent.createdAt,
      guardResults: originalResults,
    },
    currentResult: {
      allowed: currentResults.every(r => r.passed),
      timestamp: new Date().toISOString(),
      guardResults: currentResults,
    },
    differences,
  };
  
  res.json(replayResult);
});

// Get MCP/SDK contract
paymentsRouter.get('/:id/contract', (req, res) => {
  const intent = storage.getPaymentIntent(req.params.id);
  if (!intent) {
    return res.status(404).json({ error: 'Payment intent not found' });
  }
  
  const contract: McpSdkContract = intent.contract || {
    backendApiCall: {
      method: 'POST',
      endpoint: `/api/payments/${intent.id}/simulate`,
      payload: {
        amount: intent.amount,
        recipient: intent.recipient,
        recipientAddress: intent.recipientAddress,
        walletId: intent.walletId,
        chain: intent.chain,
      },
    },
    mcpToolInvoked: {
      toolName: 'create_payment_intent',
      toolId: 'mcp_tool_1',
      input: {
        amount: intent.amount,
        recipient: intent.recipient,
        chain: intent.chain,
      },
    },
    sdkMethodCalled: {
      method: 'simulate',
      params: {
        amount: intent.amount,
        recipientAddress: intent.recipientAddress,
        chain: intent.chain,
      },
      result: {
        route: intent.route,
        estimatedFee: 0.5,
      },
    },
  };
  
  res.json(contract);
});
