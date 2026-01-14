# OmniAgentPay

**A Stripe-grade application for agentic payments** — Enterprise-grade observability, control, and auditability for AI-driven payments.

## Overview

OmniAgentPay is a production-ready AI payments control plane that enables enterprises to safely deploy autonomous payment agents. The platform provides comprehensive observability, policy enforcement, and audit capabilities while maintaining a clean, professional interface inspired by Stripe, Linear, and Vercel.

## Key Features

### 🔍 Observability & Control

- **Payment Decision Timeline** — Chronological view of every step: agent actions, tool invocations, simulations, guard evaluations, approvals, and execution
- **Explain This Payment** — Deterministic explanations of who initiated payments, why they happened, and why they were allowed or blocked
- **What-If Simulation** — Test payment scenarios before execution with live guard evaluation
- **Incident Replay** — Re-run any transaction to see if it would pass with current guard rules

### 🛡️ Policy & Security

- **Guard Preset Studio** — Pre-configured security presets (Hackathon Mode, Enterprise Safe, Autonomous Agent, Finance Audit)
- **Blast Radius Preview** — See impact of guard changes on agents, tools, and daily exposure before applying
- **Enterprise Approval UX** — Approve once, approve similar (24h), or deny & update guards
- **Auditor Mode** — Read-only view for compliance and demos

### 🤖 Agent Management

- **Agent Identity & Trust** — Track agent risk tiers, trust levels, and spend reputation scores
- **Visual Trust Indicators** — Subtle badges showing agent trustworthiness
- **Agent Analytics** — Complete spending history and transaction success rates

### 🔧 Developer Tools

- **MCP/SDK Contract Explorer** — View backend API calls, MCP tool invocations, and SDK method calls
- **Copyable JSON Payloads** — Easy debugging and integration testing
- **Complete API Documentation** — Full REST API with realistic mock data

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Express.js, TypeScript
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Charts**: Recharts
- **State Management**: React Context + Custom Hooks
- **Routing**: React Router v6

## Quick Start

### Prerequisites

- Node.js 20+ (LTS recommended) and npm
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd omnipay-agent-dashboard

# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### Development

```bash
# Start backend server (Terminal 1)
cd server
npm run dev
# Server runs on http://localhost:3001

# Start frontend dev server (Terminal 2)
npm run dev
# Frontend runs on http://localhost:5173
```

### Environment Variables

Create `.env` in the root directory:

```env
VITE_API_BASE_URL=http://localhost:3001/api
```

## Project Structure

```
omnipay-agent-dashboard/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/              # shadcn/ui primitives
│   │   ├── PaymentTimeline.tsx
│   │   ├── ExplainPaymentDrawer.tsx
│   │   ├── WhatIfSimulator.tsx
│   │   ├── ApprovalModal.tsx
│   │   ├── IncidentReplay.tsx
│   │   ├── BlastRadiusPreview.tsx
│   │   ├── AgentTrustBadge.tsx
│   │   └── McpSdkContractExplorer.tsx
│   ├── pages/               # Page components
│   ├── services/            # API service layer
│   ├── types/               # TypeScript definitions
│   └── lib/                  # Utilities
├── server/
│   ├── routes/              # API route handlers
│   ├── lib/                 # Business logic
│   └── types/               # Shared types
└── docs/                     # Documentation
```

## Core Features

### 1. Payment Decision Timeline

Every payment intent includes a chronological timeline showing:
- Agent action initiation
- MCP tool invocations
- Payment simulation results
- Guard evaluations (pass/fail with reasons)
- Approval decisions
- Payment execution status

**Location**: Payment Intent Detail Page → Timeline Section

### 2. Explain This Payment

Deterministic explanations include:
- **Who**: Agent name and tool that initiated
- **Why**: Business justification
- **Decision**: Allowed/blocked with specific guard reasons
- **Route**: Chosen protocol and estimated time/fee
- **Conditions**: What would have blocked the payment

**Location**: Payment Intent Detail Page → "Explain" Button

### 3. What-If Simulation

Test payment scenarios with:
- Adjustable amount
- Guard preset selection
- Chain selection
- Time-based simulation
- Live guard evaluation results

**Location**: Guard Studio → What-If Simulator Panel

### 4. Guard Preset Studio

Four pre-configured presets:

- **Hackathon Mode**: Ultra-conservative ($100/day, $25/tx)
- **Enterprise Safe**: Balanced controls ($5k/day, $2k/tx)
- **Autonomous Agent**: High-frequency optimized ($10k/day, $500/tx)
- **Finance Audit**: Maximum visibility (no auto-approve)

**Location**: Guard Studio → Preset Cards

### 5. Blast Radius Preview

When editing guard rules, see:
- Affected agents (with impact level)
- Affected tools (with usage counts)
- Estimated daily exposure
- Current vs. projected spending

**Location**: Guard Studio → Guard Configuration (focus on any guard)

### 6. Agent Identity & Trust

Track agents with:
- Risk tiers (low, medium, high, critical)
- Trust levels (trusted, verified, new, flagged)
- Spend reputation scores (0-100)
- Transaction history and success rates

**Location**: Payment Intent Detail Page → Agent Section

### 7. Enterprise Approval UX

Approval modal with three actions:
- **Approve Once**: Single payment approval
- **Approve Similar (24h)**: Auto-approve similar payments for 24 hours
- **Deny & Update Guard**: Block and update guard rules

**Location**: Payment Intent Detail Page → "Approve" Button

### 8. Incident Replay

Re-run any transaction to:
- Compare original vs. current guard results
- See what changed in guard rules
- Determine if payment would pass today

**Location**: Payment Intent Detail Page → Incident Replay Tab

### 9. Auditor Mode

Read-only mode for:
- Compliance reviews
- Demo environments
- Training sessions

**Location**: Top Navbar → Auditor Mode Toggle

### 10. MCP/SDK Contract Explorer

View complete integration details:
- Backend API call payloads
- MCP tool names and inputs/outputs
- SDK method calls and results
- Copyable JSON for debugging

**Location**: Payment Intent Detail Page → Contract Explorer Tab

## API Endpoints

### Payment Intents

- `GET /api/payments` — List all payment intents
- `GET /api/payments/:id` — Get payment intent details
- `POST /api/payments` — Create new payment intent
- `POST /api/payments/:id/simulate` — Simulate payment
- `POST /api/payments/:id/approve` — Approve payment
- `POST /api/payments/:id/execute` — Execute payment
- `GET /api/payments/:id/timeline` — Get payment timeline
- `GET /api/payments/:id/explanation` — Get payment explanation
- `POST /api/payments/simulate` — What-if simulation
- `POST /api/payments/:id/replay` — Replay incident
- `GET /api/payments/:id/contract` — Get MCP/SDK contract

### Agents

- `GET /api/agents` — List all agents
- `GET /api/agents/:id` — Get agent details
- `POST /api/agents` — Create agent
- `PATCH /api/agents/:id` — Update agent

### Guards

- `GET /api/guards` — List all guards
- `PATCH /api/guards/:id` — Update guard
- `POST /api/guards/simulate` — Simulate guard policy
- `GET /api/guards/blast-radius` — Get blast radius

### Ledger

- `GET /api/ledger` — List ledger entries
- `GET /api/ledger/:id` — Get ledger entry

See [docs/API.md](./docs/API.md) for complete API documentation.

## Design Philosophy

- **Clean & Professional**: Stripe/Linear/Vercel-inspired design
- **No Flashy UI**: Neutral colors, low-contrast accents
- **Subtle Motion**: Hover/focus states only, no animations
- **Accessibility First**: Keyboard navigation, ARIA labels
- **Production Ready**: Loading states, error handling, empty states

## Development

### Building for Production

```bash
npm run build
```

Output is in `dist/` directory.

### Running Tests

```bash
npm test
```

### Code Quality

- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting (recommended)

## Documentation

- [API Documentation](./docs/API.md) — Complete API reference
- [Features Guide](./docs/FEATURES.md) — Detailed feature documentation
- [Architecture](./docs/ARCHITECTURE.md) — System architecture overview
- [Setup Guide](./docs/SETUP.md) — Detailed setup instructions
- [Component Docs](./docs/COMPONENTS.md) — Component reference
- [Usage Guide](./docs/USAGE.md) — Usage examples and workflows

## Contributing

This is a proprietary project. For internal contributions:

1. Create a feature branch
2. Make your changes
3. Ensure all tests pass
4. Submit a pull request

## License

Proprietary - OmniAgentPay

## Support

For questions or issues, contact the development team.

---

**Built with ❤️ for enterprise AI payment operations**
