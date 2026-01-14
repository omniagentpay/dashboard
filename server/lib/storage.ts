import type {
  PaymentIntent,
  Transaction,
  GuardConfig,
  CrossChainTransfer,
  Wallet,
  WorkspaceContext,
  Agent,
  LedgerEntry,
  X402Api,
} from '../types/index.js';

const paymentIntents = new Map<string, PaymentIntent>();
const transactions = new Map<string, Transaction>();
const guardConfigs = new Map<string, GuardConfig>();
const crossChainTransfers = new Map<string, CrossChainTransfer>();
const wallets = new Map<string, Wallet>();
const workspaces = new Map<string, WorkspaceContext>();
const agents = new Map<string, Agent>();
const ledgerEntries = new Map<string, LedgerEntry>();
const x402Apis = new Map<string, X402Api>();
const apiKeys = new Map<string, { id: string; workspaceId: string; key: string; name?: string; createdAt: string; lastUsed?: string }>();

// Initialize default workspace
const defaultWorkspace: WorkspaceContext = {
  id: 'ws_1',
  name: 'Default Workspace',
  plan: 'pro',
};
workspaces.set(defaultWorkspace.id, defaultWorkspace);

const defaultGuards: GuardConfig[] = [
  {
    id: 'guard_1',
    name: 'Daily Budget',
    enabled: true,
    type: 'budget',
    config: { limit: 3000, period: 'day' },
  },
  {
    id: 'guard_2',
    name: 'Single Transaction Limit',
    enabled: true,
    type: 'single_tx',
    config: { limit: 2000 },
  },
  {
    id: 'guard_3',
    name: 'Rate Limit',
    enabled: true,
    type: 'rate_limit',
    config: { limit: 50, period: 'hour' },
  },
  {
    id: 'guard_4',
    name: 'Auto-approve Threshold',
    enabled: true,
    type: 'auto_approve',
    config: { threshold: 100 },
  },
];

defaultGuards.forEach(guard => guardConfigs.set(guard.id, guard));

// Initialize default agents
const defaultAgents: Agent[] = [
  {
    id: 'agent_1',
    name: 'Payment Orchestrator',
    purpose: 'Handles payment routing and execution',
    riskTier: 'low',
    trustLevel: 'trusted',
    spendReputationScore: 95,
    totalSpent: 45000,
    totalTransactions: 120,
    successfulTransactions: 118,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    lastActiveAt: new Date().toISOString(),
  },
  {
    id: 'agent_2',
    name: 'Invoice Processor',
    purpose: 'Processes and pays invoices automatically',
    riskTier: 'medium',
    trustLevel: 'verified',
    spendReputationScore: 82,
    totalSpent: 28000,
    totalTransactions: 45,
    successfulTransactions: 44,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    lastActiveAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'agent_3',
    name: 'Experimental Agent',
    purpose: 'Testing new payment features',
    riskTier: 'high',
    trustLevel: 'new',
    spendReputationScore: 45,
    totalSpent: 500,
    totalTransactions: 8,
    successfulTransactions: 6,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    lastActiveAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
];

defaultAgents.forEach(agent => agents.set(agent.id, agent));

export const storage = {
  // Payment Intents
  getPaymentIntent(id: string): PaymentIntent | undefined {
    return paymentIntents.get(id);
  },
  
  getAllPaymentIntents(): PaymentIntent[] {
    return Array.from(paymentIntents.values());
  },
  
  savePaymentIntent(intent: PaymentIntent): void {
    paymentIntents.set(intent.id, intent);
  },
  
  // Transactions
  getTransaction(id: string): Transaction | undefined {
    return transactions.get(id);
  },
  
  getAllTransactions(): Transaction[] {
    return Array.from(transactions.values());
  },
  
  saveTransaction(tx: Transaction): void {
    transactions.set(tx.id, tx);
  },
  
  // Guards
  getGuard(id: string): GuardConfig | undefined {
    return guardConfigs.get(id);
  },
  
  getAllGuards(): GuardConfig[] {
    return Array.from(guardConfigs.values());
  },
  
  saveGuard(guard: GuardConfig): void {
    guardConfigs.set(guard.id, guard);
  },
  
  // Cross-chain Transfers
  getCrossChainTransfer(id: string): CrossChainTransfer | undefined {
    return crossChainTransfers.get(id);
  },
  
  getAllCrossChainTransfers(): CrossChainTransfer[] {
    return Array.from(crossChainTransfers.values());
  },
  
  saveCrossChainTransfer(transfer: CrossChainTransfer): void {
    crossChainTransfers.set(transfer.id, transfer);
  },
  
  // Wallets
  getWallet(id: string): Wallet | undefined {
    return wallets.get(id);
  },
  
  getAllWallets(): Wallet[] {
    return Array.from(wallets.values());
  },
  
  saveWallet(wallet: Wallet): void {
    wallets.set(wallet.id, wallet);
  },
  
  // Workspaces
  getWorkspace(id: string): WorkspaceContext | undefined {
    return workspaces.get(id);
  },
  
  getAllWorkspaces(): WorkspaceContext[] {
    return Array.from(workspaces.values());
  },
  
  saveWorkspace(workspace: WorkspaceContext): void {
    workspaces.set(workspace.id, workspace);
  },
  
  deleteWorkspace(id: string): boolean {
    // Delete all associated data
    const workspaceWallets = Array.from(wallets.values()).filter(w => w.id.startsWith(id));
    workspaceWallets.forEach(w => wallets.delete(w.id));
    
    const workspaceIntents = Array.from(paymentIntents.values()).filter(pi => pi.id.startsWith(id));
    workspaceIntents.forEach(pi => paymentIntents.delete(pi.id));
    
    const workspaceTransactions = Array.from(transactions.values()).filter(tx => tx.id.startsWith(id));
    workspaceTransactions.forEach(tx => transactions.delete(tx.id));
    
    // Delete API keys for this workspace
    const workspaceApiKeys = Array.from(apiKeys.values()).filter(ak => ak.workspaceId === id);
    workspaceApiKeys.forEach(ak => apiKeys.delete(ak.id));
    
    return workspaces.delete(id);
  },
  
  // API Keys
  getApiKey(id: string) {
    return apiKeys.get(id);
  },
  
  getApiKeysByWorkspace(workspaceId: string) {
    return Array.from(apiKeys.values()).filter(ak => ak.workspaceId === workspaceId);
  },
  
  saveApiKey(apiKey: { id: string; workspaceId: string; key: string; name?: string; createdAt: string; lastUsed?: string }): void {
    apiKeys.set(apiKey.id, apiKey);
  },
  
  deleteApiKey(id: string): boolean {
    return apiKeys.delete(id);
  },
  
  // Agents
  getAgent(id: string): Agent | undefined {
    return agents.get(id);
  },
  
  getAllAgents(): Agent[] {
    return Array.from(agents.values());
  },
  
  saveAgent(agent: Agent): void {
    agents.set(agent.id, agent);
  },
  
  // Ledger
  getLedgerEntry(id: string): LedgerEntry | undefined {
    return ledgerEntries.get(id);
  },
  
  getAllLedgerEntries(): LedgerEntry[] {
    return Array.from(ledgerEntries.values());
  },
  
  saveLedgerEntry(entry: LedgerEntry): void {
    ledgerEntries.set(entry.id, entry);
  },
  
  // X402 APIs
  getX402Api(id: string): X402Api | undefined {
    return x402Apis.get(id);
  },
  
  getAllX402Apis(): X402Api[] {
    return Array.from(x402Apis.values());
  },
  
  saveX402Api(api: X402Api): void {
    x402Apis.set(api.id, api);
  },
};
