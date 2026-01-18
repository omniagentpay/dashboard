# Gemini AI Agent Integration

## Overview

The OmniAgentPay dashboard now includes a fully integrated Google Gemini AI agent that can help users manage payments, wallets, and transactions through natural language conversations.

## Setup

1. **Get a Gemini API Key**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Copy the API key

2. **Configure Environment Variable**
   - Create a `.env` file in the `omnipay-agent-dashboard` directory
   - Add: `VITE_GEMINI_API_KEY=your_api_key_here`
   - Restart the development server

## Features

### Payment Tools Available to Gemini

The agent has access to the following payment tools:

1. **check_balance** - Check USDC balance for a specific wallet or unified balance
2. **list_wallets** - List all available wallets with addresses and chains
3. **create_payment_intent** - Create a payment intent to send USDC
4. **simulate_payment** - Simulate a payment to check guard compliance
5. **approve_payment** - Approve a payment intent that requires approval
6. **execute_payment** - Execute an approved payment intent
7. **list_transactions** - List recent transactions with optional filters
8. **list_payment_intents** - List all payment intents with their status

### Usage Examples

Users can interact with the agent using natural language:

- "Check my wallet balances"
- "Show recent transactions"
- "List all my wallets"
- "Create a payment of 100 USDC to 0x1234..."
- "Simulate a payment for intent abc123"
- "Approve payment intent xyz789"

## Architecture

### Service Layer (`src/services/gemini.ts`)

- **geminiService.chat()** - Main chat interface that handles messages and tool calls
- **geminiService.chatStream()** - Streaming interface for real-time responses (future enhancement)
- **executeToolCall()** - Executes payment tools based on Gemini's function calls
- **paymentTools** - Array of function declarations for Gemini

### UI Layer (`src/pages/app/AgentChatPage.tsx`)

- Chat interface with message history
- Tool call visualization
- Quick action buttons
- Pending payment approval panel
- Configuration warning for missing API key

## How It Works

1. User sends a message through the chat interface
2. Message is sent to Gemini with conversation history
3. Gemini analyzes the request and may call payment tools
4. Tool calls are executed against the OmniAgentPay backend
5. Tool results are sent back to Gemini
6. Gemini generates a final response based on tool results
7. Response is displayed to the user with tool call details

## Error Handling

- Missing API key: Shows warning card in UI
- API errors: Displays error message in chat
- Tool execution errors: Returns error in tool output, Gemini explains to user

## Security Considerations

- API key is stored in environment variables (never in code)
- All payment operations go through the existing backend API
- Tool calls are logged and visible in the UI
- Payment approvals still require explicit user confirmation

## Future Enhancements

- [ ] Streaming responses for real-time updates
- [ ] Voice input/output
- [ ] Multi-language support
- [ ] Advanced guard explanations
- [ ] Payment templates and recurring payments
- [ ] Integration with x402 directory for API payments
