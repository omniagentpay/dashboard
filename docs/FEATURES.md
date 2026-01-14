# Features Documentation

Comprehensive guide to all OmniAgentPay features.

## Table of Contents

1. [Payment Decision Timeline](#payment-decision-timeline)
2. [Explain This Payment](#explain-this-payment)
3. [What-If Simulation](#what-if-simulation)
4. [Guard Preset Studio](#guard-preset-studio)
5. [Blast Radius Preview](#blast-radius-preview)
6. [Agent Identity & Trust](#agent-identity--trust)
7. [Enterprise Approval UX](#enterprise-approval-ux)
8. [Incident Replay](#incident-replay)
9. [Auditor Mode](#auditor-mode)
10. [MCP/SDK Contract Explorer](#mcpsdk-contract-explorer)

## Payment Decision Timeline

### Overview

The Payment Decision Timeline provides a chronological view of every step in a payment's lifecycle, from agent initiation to final execution.

### Features

- **Visual Timeline**: Vertical timeline with status indicators
- **Event Types**: 
  - Agent action initiation
  - MCP tool invocations
  - Payment simulation
  - Guard evaluations
  - Approval decisions
  - Payment execution
- **Status Indicators**: Success (green), Failed (red), Pending (gray)
- **Detailed Information**: Each event shows timestamps, tool inputs/outputs, guard results, and transaction hashes

### Usage

1. Navigate to a Payment Intent detail page
2. Scroll to the "Payment Decision Timeline" section
3. Review events chronologically from top to bottom

### Example Timeline

```
✓ Agent initiated payment (10:30:00)
  → Payment Orchestrator initiated a payment request
  
✓ Tool invoked (10:30:05)
  → MCP tool create_payment_intent was invoked
  → Input: { amount: 1000, recipient: "Vendor Inc" }
  
✓ Payment simulation (10:30:10)
  → Route: auto, Fee: $0.50
  
✓ Guard: Daily Budget (10:30:15)
  → Passed: Within daily limit
  
✓ Guard: Single Transaction Limit (10:30:15)
  → Passed: Amount below limit
  
✓ Approval decision (10:30:20)
  → Payment approved
  
✓ Payment executed (10:35:00)
  → Transaction: 0x1234...abcd
```

## Explain This Payment

### Overview

Deterministic explanations of payment decisions, showing who initiated, why it happened, and why it was allowed or blocked.

### Features

- **Initiation Details**: Agent name, tool used, and input parameters
- **Business Justification**: Why the payment was requested
- **Decision Rationale**: Allowed/blocked with specific guard reasons
- **Route Information**: Chosen protocol, estimated time, and fees
- **Blocking Conditions**: What would have blocked the payment

### Usage

1. Navigate to a Payment Intent detail page
2. Click the "Explain" button in the header
3. Review the explanation drawer

### Example Explanation

**Initiated By:**
- Agent: Payment Orchestrator
- Tool: create_payment_intent
- Input: { amount: 1000, recipient: "Vendor Inc" }

**Why It Happened:**
Monthly subscription payment for Vendor Inc services.

**Decision:**
✓ Allowed - All guard checks passed

**Route Chosen:**
- Protocol: AUTO
- Explanation: Auto-selected optimal route
- Estimated Time: 2-5 minutes
- Estimated Fee: $0.50

**Conditions That Would Block:**
- Amount exceeds single transaction limit (Current: $1000, Threshold: $2000)
- Daily budget exceeded (Current: $1500, Threshold: $3000)

## What-If Simulation

### Overview

Test payment scenarios before execution with live guard evaluation.

### Features

- **Adjustable Parameters**:
  - Amount (USDC)
  - Guard preset selection
  - Chain selection
  - Time-based simulation
- **Live Results**: Instant feedback on allowed/blocked status
- **Guard Breakdown**: See which guards pass or fail
- **Route Estimation**: Estimated fees and routing

### Usage

1. Navigate to Guard Studio
2. Open the "What-If Simulation" panel
3. Enter amount and optional parameters
4. Click "Simulate"
5. Review results

### Example Simulation

**Input:**
- Amount: $1,500
- Chain: Ethereum
- Guard Preset: Enterprise Safe

**Result:**
✓ Payment Allowed
- Daily Budget: Pass
- Single Transaction Limit: Pass
- Rate Limit: Pass

**Estimated Fee:** $0.50
**Route:** AUTO

## Guard Preset Studio

### Overview

Pre-configured security presets for different use cases.

### Available Presets

#### 1. Hackathon Mode

**Purpose**: Ultra-conservative limits for demos and testing

**Philosophy**: Maximum safety with minimal risk exposure. Perfect for public demos and hackathons.

**Thresholds:**
- Daily Budget: $100
- Single Transaction: $25
- Auto-Approve: $5
- Rate Limit: 10 tx/hour

**Use Case**: Public demonstrations, hackathons, initial testing

#### 2. Enterprise Safe

**Purpose**: Strict controls for enterprise production

**Philosophy**: Balanced security and operational efficiency. Designed for organizations needing strong oversight.

**Thresholds:**
- Daily Budget: $5,000
- Single Transaction: $2,000
- Auto-Approve: $100
- Rate Limit: 50 tx/hour

**Use Case**: Production enterprise environments

#### 3. Autonomous Agent

**Purpose**: Optimized for high-frequency agent operations

**Philosophy**: Enable autonomous agents to operate efficiently with reasonable safeguards.

**Thresholds:**
- Daily Budget: $10,000
- Single Transaction: $500
- Auto-Approve: $200
- Rate Limit: 200 tx/hour

**Use Case**: High-frequency automated payments

#### 4. Finance Audit

**Purpose**: Maximum visibility and control for financial compliance

**Philosophy**: Every transaction requires approval. Complete audit trail with no auto-approvals.

**Thresholds:**
- Daily Budget: $20,000
- Single Transaction: $5,000
- Auto-Approve: $0 (disabled)
- Rate Limit: 100 tx/hour

**Use Case**: Finance teams requiring full oversight

### Usage

1. Navigate to Guard Studio
2. Review preset cards
3. Click a preset card to apply
4. Review updated guard configurations

## Blast Radius Preview

### Overview

See the impact of guard changes before applying them.

### Features

- **Affected Agents**: List of agents impacted with impact levels (high/medium/low)
- **Affected Tools**: Tools that will be affected with usage counts
- **Daily Exposure**: Estimated daily spending vs. current spending
- **Visual Progress**: Progress bar showing current vs. projected spending

### Usage

1. Navigate to Guard Studio
2. Focus on any guard input field
3. Blast radius preview appears below
4. Review impact before saving changes

### Example Blast Radius

**Affected Agents:**
- Payment Orchestrator (high impact)
- Invoice Processor (medium impact)
- Experimental Agent (low impact)

**Affected Tools:**
- create_payment_intent (45 uses)
- process_invoice (23 uses)

**Daily Exposure:**
- Current Daily Spend: $1,500
- Estimated Daily Exposure: $5,000
- Progress: 30% of limit

## Agent Identity & Trust

### Overview

Track and visualize agent trustworthiness and risk levels.

### Features

- **Risk Tiers**: Low, Medium, High, Critical
- **Trust Levels**: Trusted, Verified, New, Flagged
- **Reputation Scores**: 0-100 based on transaction history
- **Visual Indicators**: Subtle badges showing trust status
- **Analytics**: Total spent, transaction counts, success rates

### Trust Level Indicators

- **Trusted** (Green): High reputation, low risk, proven track record
- **Verified** (Blue): Good reputation, medium risk, established agent
- **New** (Gray): Low transaction count, needs monitoring
- **Flagged** (Red): Issues detected, requires review

### Usage

1. View agent information on Payment Intent detail pages
2. See trust badges next to agent names
3. Review agent analytics in agent management (future feature)

## Enterprise Approval UX

### Overview

Professional approval interface with multiple approval options.

### Approval Actions

#### 1. Approve Once

Single payment approval. Use for one-time payments or when you want to review each payment individually.

**Use Case**: High-value payments, unusual recipients, first-time approvals

#### 2. Approve Similar (24h)

Auto-approve similar payments for 24 hours. Similarity is based on:
- Same recipient
- Similar amount range (±20%)
- Same chain

**Use Case**: Recurring payments, trusted vendors, batch approvals

#### 3. Deny & Update Guard

Block the payment and update guard rules to prevent similar payments.

**Use Case**: Unauthorized payments, policy violations, security concerns

### Approval Modal Features

- **Amount Display**: Large, clear amount
- **Justification**: Business reason for payment
- **Guard Checks**: Visual pass/fail indicators
- **Route Details**: Protocol, fees, estimated time
- **Action Buttons**: Clear, accessible buttons

### Usage

1. Navigate to Payment Intent awaiting approval
2. Click "Approve" button
3. Review approval modal
4. Select approval action
5. Confirm

## Incident Replay

### Overview

Re-run any transaction to see if it would pass with current guard rules.

### Features

- **Original Result**: What happened when the payment was originally processed
- **Current Result**: What would happen with current guard rules
- **Differences**: Side-by-side comparison of guard results
- **Change Detection**: Highlights which guards changed

### Usage

1. Navigate to any Payment Intent detail page
2. Open "Incident Replay" tab
3. Click "Replay Transaction"
4. Review original vs. current results
5. See what changed

### Example Replay

**Original Result (Jan 15, 10:30 AM):**
✓ Allowed - 3 of 3 guards passed

**Current Result (Now):**
✗ Blocked - 2 of 3 guards passed

**Changes Detected:**
- Daily Budget: Was Pass → Now Fail
  - Reason: Daily limit was reduced from $5,000 to $3,000

## Auditor Mode

### Overview

Read-only mode for compliance reviews, demos, and training.

### Features

- **No Mutations**: All write operations disabled
- **Full Visibility**: Can view all data, history, guards, agents
- **Visual Indicator**: Shows "(Read-only)" when enabled
- **Toggle**: Easy on/off in navbar

### Usage

1. Click "Auditor Mode" toggle in top navbar
2. All write operations become disabled
3. Full read access maintained
4. Toggle off to restore write access

### Use Cases

- **Compliance Reviews**: Auditors can review without risk
- **Demos**: Safe demonstration environment
- **Training**: New users can explore without making changes

## MCP/SDK Contract Explorer

### Overview

View complete integration details for debugging and integration testing.

### Features

- **Backend API Calls**: Method, endpoint, payload, headers
- **MCP Tool Invocations**: Tool name, ID, input, output
- **SDK Method Calls**: Method name, parameters, results
- **Copyable JSON**: Easy copying for debugging
- **Tabbed Interface**: Organized by API/MCP/SDK

### Usage

1. Navigate to Payment Intent detail page
2. Open "Contract Explorer" tab
3. Switch between API/MCP/SDK tabs
4. Copy JSON payloads as needed

### Example Contract

**Backend API Call:**
```json
{
  "method": "POST",
  "endpoint": "/api/payments/pi_123/simulate",
  "payload": {
    "amount": 1000,
    "recipient": "Vendor Inc"
  }
}
```

**MCP Tool Invoked:**
```json
{
  "toolName": "create_payment_intent",
  "toolId": "mcp_tool_payment",
  "input": {
    "amount": 1000,
    "recipient": "Vendor Inc"
  }
}
```

**SDK Method Called:**
```json
{
  "method": "simulate",
  "params": {
    "amount": 1000,
    "recipientAddress": "0x742d35..."
  },
  "result": {
    "route": "auto",
    "estimatedFee": 0.5
  }
}
```

## Best Practices

### Payment Intents

- Always review the timeline before approving
- Use "Explain This Payment" for complex decisions
- Check agent trust levels for new agents

### Guard Configuration

- Use presets as starting points
- Review blast radius before making changes
- Test with What-If Simulation

### Approval Workflow

- Use "Approve Similar" for recurring payments
- Use "Deny & Update Guard" for policy violations
- Review guard checks in approval modal

### Incident Investigation

- Use Incident Replay to understand rule changes
- Compare original vs. current guard results
- Review timeline for complete context

### Compliance

- Enable Auditor Mode for reviews
- Export transaction data for audits
- Maintain complete audit trails
