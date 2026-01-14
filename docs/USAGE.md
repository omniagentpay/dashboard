# Usage Guide

Practical examples and workflows for using OmniAgentPay.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Creating Payment Intents](#creating-payment-intents)
3. [Approving Payments](#approving-payments)
4. [Configuring Guards](#configuring-guards)
5. [Monitoring Agents](#monitoring-agents)
6. [Investigating Incidents](#investigating-incidents)
7. [Audit Workflows](#audit-workflows)

## Getting Started

### First Login

1. Start the application (see [SETUP.md](./SETUP.md))
2. Navigate to `http://localhost:5173`
3. You'll see the dashboard with default data

### Dashboard Overview

The dashboard shows:
- **Spend Today**: Current daily spending with progress ring
- **Remaining Budget**: Available budget for the day
- **Success Rate**: Percentage of successful payments
- **Active Wallets**: Number of active wallets
- **Pending Approvals**: Payments awaiting approval
- **Recent Activity**: Latest transactions

## Creating Payment Intents

### Basic Payment Intent

1. Navigate to **Payment Intents** page
2. Click **"New Intent"** button
3. Fill in the form:
   - **Amount**: Payment amount in USDC
   - **Recipient**: Recipient name
   - **Recipient Address**: Wallet address
   - **Description**: Payment description
   - **Wallet**: Select wallet
   - **Chain**: Select blockchain
4. Click **"Create"**

### Simulating Payment

1. After creating an intent, click on it to view details
2. The intent starts in "pending" status
3. Click **"Simulate"** (if available) or wait for auto-simulation
4. Review guard results and route selection

### Viewing Timeline

1. Open a payment intent detail page
2. Scroll to **"Payment Decision Timeline"** section
3. Review events chronologically:
   - Agent action
   - Tool invocation
   - Simulation
   - Guard evaluations
   - Approval decision
   - Execution

## Approving Payments

### Single Payment Approval

1. Navigate to payment intent with "awaiting_approval" status
2. Click **"Approve"** button
3. Review approval modal:
   - Amount
   - Justification
   - Guard checks
   - Route details
4. Click **"Approve Once"**

### Approving Similar Payments

1. Open approval modal
2. Review payment details
3. Click **"Approve Similar (24h)"**
4. Similar payments will auto-approve for 24 hours

**Similarity Criteria:**
- Same recipient
- Similar amount (±20%)
- Same chain

### Denying Payments

1. Open approval modal
2. Review why payment should be denied
3. Click **"Deny & Update Guard"**
4. Update guard rules to prevent similar payments

### Using Explain Feature

1. Open any payment intent
2. Click **"Explain"** button in header
3. Review explanation drawer:
   - Who initiated
   - Why it happened
   - Decision rationale
   - Route chosen
   - Blocking conditions

## Configuring Guards

### Using Presets

1. Navigate to **Guard Studio**
2. Review available presets:
   - Hackathon Mode
   - Enterprise Safe
   - Autonomous Agent
   - Finance Audit
3. Click a preset card to apply
4. Review updated guard configurations

### Custom Guard Configuration

1. Navigate to **Guard Studio**
2. Find guard in **"Guard Configuration"** section
3. Toggle guard on/off with switch
4. Adjust limits/thresholds:
   - Daily Budget: Set daily spending limit
   - Single Transaction: Set max per transaction
   - Auto-Approve: Set auto-approve threshold
   - Rate Limit: Set transactions per hour
5. Focus on input field to see **Blast Radius Preview**
6. Review impact before saving

### Testing with What-If Simulation

1. Navigate to **Guard Studio**
2. Open **"What-If Simulation"** panel
3. Enter test parameters:
   - Amount: $1,500
   - Chain: Ethereum
   - Guard Preset: (optional)
4. Click **"Simulate"**
5. Review results:
   - Allowed/Blocked status
   - Guard breakdown
   - Estimated fees
   - Route selection

### Blast Radius Analysis

1. In Guard Studio, focus on any guard input field
2. Blast radius preview appears below
3. Review:
   - **Affected Agents**: Which agents will be impacted
   - **Affected Tools**: Which tools will be affected
   - **Daily Exposure**: Projected daily spending
4. Adjust guard settings based on impact
5. Save changes

## Monitoring Agents

### Viewing Agent Information

1. Open any payment intent
2. View agent section (if agent is assigned)
3. See:
   - Agent name
   - Trust badge (trusted/verified/new/flagged)
   - Risk tier
   - Reputation score
   - Purpose

### Understanding Trust Levels

- **Trusted** (Green): High reputation, proven track record
- **Verified** (Blue): Good reputation, established agent
- **New** (Gray): Low transaction count, needs monitoring
- **Flagged** (Red): Issues detected, requires review

### Agent Analytics (Future)

Agent management page will show:
- Total spent
- Transaction count
- Success rate
- Recent activity
- Risk assessment

## Investigating Incidents

### Using Incident Replay

1. Open any payment intent detail page
2. Navigate to **"Incident Replay"** tab
3. Click **"Replay Transaction"**
4. Compare:
   - **Original Result**: What happened originally
   - **Current Result**: What would happen now
   - **Differences**: What changed in guard rules

### Understanding Changes

When replaying, you'll see:
- Which guards changed
- Original vs. current results
- Reasons for changes
- Impact assessment

### Timeline Investigation

1. Open payment intent
2. Review **Payment Decision Timeline**
3. Identify:
   - When payment was initiated
   - Which tools were used
   - Guard evaluation results
   - Approval decision
   - Execution status

### Contract Explorer

1. Open payment intent
2. Navigate to **"Contract Explorer"** tab
3. Review:
   - **API Call**: Backend API payload
   - **MCP Tool**: Tool invocation details
   - **SDK Method**: SDK method calls
4. Copy JSON for debugging

## Audit Workflows

### Enabling Auditor Mode

1. Click **"Auditor Mode"** toggle in top navbar
2. Mode indicator shows "(Read-only)"
3. All write operations disabled
4. Full read access maintained

### Compliance Review

1. Enable Auditor Mode
2. Navigate through:
   - Payment intents
   - Transactions
   - Guard configurations
   - Agent information
3. Review without risk of changes
4. Export data if needed (future feature)

### Demo Preparation

1. Enable Auditor Mode
2. Prepare demo data
3. Navigate through features
4. Show capabilities safely
5. Disable Auditor Mode after demo

## Common Workflows

### Daily Operations

1. **Morning**: Review dashboard, check pending approvals
2. **During Day**: Approve payments, monitor activity
3. **Evening**: Review daily spending, check guard limits

### New Agent Onboarding

1. Create agent (via API or UI)
2. Assign to payment intents
3. Monitor trust level
4. Review transaction history
5. Adjust risk tier as needed

### Guard Rule Updates

1. Review current guard performance
2. Use What-If Simulation to test changes
3. Check Blast Radius Preview
4. Apply preset or custom configuration
5. Monitor impact after changes

### Incident Response

1. Identify blocked or failed payment
2. Use Explain feature to understand why
3. Review timeline for complete context
4. Use Incident Replay to see rule changes
5. Update guards if needed
6. Approve if appropriate

## Tips & Best Practices

### Payment Approval

- Always review guard checks before approving
- Use "Approve Similar" for recurring payments
- Use "Deny & Update Guard" for policy violations
- Check agent trust level for new agents

### Guard Configuration

- Start with presets, customize as needed
- Use What-If Simulation before making changes
- Review Blast Radius Preview for impact
- Test with small amounts first

### Monitoring

- Check dashboard daily
- Review pending approvals regularly
- Monitor agent trust levels
- Track daily spending trends

### Troubleshooting

- Use Explain feature for payment decisions
- Review timeline for complete context
- Use Contract Explorer for debugging
- Check Incident Replay for rule changes

## Keyboard Shortcuts

- **Escape**: Close modals/drawers
- **Enter**: Submit forms
- **Tab**: Navigate between fields
- **Arrow Keys**: Navigate lists (future)

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile: Responsive design

## Getting Help

- **Documentation**: Check `docs/` directory
- **API Reference**: See [API.md](./API.md)
- **Features**: See [FEATURES.md](./FEATURES.md)
- **Support**: Contact development team
