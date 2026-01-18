/**
 * Google Gemini AI Service
 * 
 * Integrates Gemini AI with OmniAgentPay payment operations
 */

import { GoogleGenerativeAI, SchemaType, FunctionDeclaration } from '@google/generative-ai';
import { paymentsService } from './payments';
import { walletsService } from './wallets';
import type { ChatMessage } from '@/types';
import { checkRateLimit, recordRequest } from '@/utils/rateLimiter';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
// Default to gemini-2.5-flash (newer, faster) or fallback to gemini-1.5-pro
const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-flash';

if (!GEMINI_API_KEY) {
  console.warn('VITE_GEMINI_API_KEY not set. Gemini features will be disabled.');
}

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

/**
 * Payment tools available to the Gemini agent
 */
const paymentTools: FunctionDeclaration[] = [
  {
    name: 'check_balance',
    description: 'Check the USDC balance for a specific wallet or get unified balance across all wallets',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        walletId: {
          type: SchemaType.STRING,
          description: 'Optional wallet ID. If not provided, returns unified balance across all wallets',
        },
      },
      required: [],
    },
  },
  {
    name: 'list_wallets',
    description: 'List all available wallets with their addresses and chains',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
      required: [],
    },
  },
  {
    name: 'create_payment_intent',
    description: 'Create a payment intent to send USDC to a recipient. This simulates and validates the payment before execution.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        amount: {
          type: SchemaType.NUMBER,
          description: 'Amount in USDC to send',
        },
        recipient: {
          type: SchemaType.STRING,
          description: 'Recipient address (0x...) or identifier',
        },
        recipientAddress: {
          type: SchemaType.STRING,
          description: 'Blockchain address of the recipient (0x format)',
        },
        description: {
          type: SchemaType.STRING,
          description: 'Human-readable description of the payment',
        },
        walletId: {
          type: SchemaType.STRING,
          description: 'Source wallet ID',
        },
        chain: {
          type: SchemaType.STRING,
          description: 'Blockchain network (ARC Testnet)',
        },
      },
      required: ['amount', 'recipient', 'recipientAddress', 'walletId', 'chain'],
    },
  },
  {
    name: 'simulate_payment',
    description: 'Simulate a payment to check if it would succeed, including guard checks and fee estimation',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        intentId: {
          type: SchemaType.STRING,
          description: 'Payment intent ID to simulate',
        },
      },
      required: ['intentId'],
    },
  },
  {
    name: 'approve_payment',
    description: 'Approve a payment intent that requires approval',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        intentId: {
          type: SchemaType.STRING,
          description: 'Payment intent ID to approve',
        },
      },
      required: ['intentId'],
    },
  },
  {
    name: 'execute_payment',
    description: 'Execute an approved payment intent, sending funds on-chain',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        intentId: {
          type: SchemaType.STRING,
          description: 'Payment intent ID to execute',
        },
      },
      required: ['intentId'],
    },
  },
  {
    name: 'list_transactions',
    description: 'List recent transactions with optional filters',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        walletId: {
          type: SchemaType.STRING,
          description: 'Optional wallet ID to filter transactions',
        },
        limit: {
          type: SchemaType.NUMBER,
          description: 'Maximum number of transactions to return (default: 10)',
        },
      },
      required: [],
    },
  },
  {
    name: 'list_payment_intents',
    description: 'List all payment intents with their current status',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        status: {
          type: SchemaType.STRING,
          description: 'Optional status filter (pending, awaiting_approval, approved, executed, failed)',
        },
      },
      required: [],
    },
  },
];

/**
 * Execute a tool call from Gemini
 */
async function executeToolCall(toolName: string, args: Record<string, unknown>): Promise<unknown> {
  try {
    switch (toolName) {
      case 'check_balance':
        if (args.walletId) {
          const balance = await walletsService.getWalletBalance(args.walletId as string);
          return balance || { error: 'Wallet not found' };
        } else {
          return await walletsService.getUnifiedBalance();
        }

      case 'list_wallets':
        return await walletsService.getWallets();

      case 'create_payment_intent':
        return await paymentsService.createIntent({
          amount: args.amount as number,
          recipient: args.recipient as string,
          recipientAddress: args.recipientAddress as string,
          description: args.description as string || `Payment to ${args.recipient}`,
          walletId: args.walletId as string,
          chain: args.chain as string,
        });

      case 'simulate_payment':
        return await paymentsService.simulateIntent(args.intentId as string);

      case 'approve_payment':
        const approved = await paymentsService.approveIntent(args.intentId as string);
        return { success: approved };

      case 'execute_payment':
        return await paymentsService.executeIntent(args.intentId as string);

      case 'list_transactions':
        return await paymentsService.getTransactions({
          walletId: args.walletId as string | undefined,
          limit: args.limit as number | undefined,
        });

      case 'list_payment_intents':
        const intents = await paymentsService.getIntents();
        if (args.status) {
          return intents.filter(i => i.status === args.status);
        }
        return intents;

      default:
        return { error: `Unknown tool: ${toolName}` };
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Convert chat messages to Gemini format
 * Ensures the first message is always from the user (Gemini requirement)
 */
function messagesToGeminiHistory(messages: ChatMessage[]) {
  // Filter out system messages and welcome messages (identified by id === 'welcome')
  const conversationMessages = messages.filter(
    msg => msg.role !== 'system' && msg.id !== 'welcome'
  );
  
  // Ensure first message is from user
  if (conversationMessages.length > 0 && conversationMessages[0].role !== 'user') {
    // If first message is not from user, remove it (shouldn't happen, but safety check)
    const firstUserIndex = conversationMessages.findIndex(msg => msg.role === 'user');
    if (firstUserIndex > 0) {
      conversationMessages.splice(0, firstUserIndex);
    } else if (firstUserIndex === -1) {
      // No user messages found, return empty (shouldn't happen)
      return [];
    }
  }
  
  return conversationMessages.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }],
  }));
}

/**
 * System prompt for the payment agent
 */
const SYSTEM_PROMPT = `You are OmniAgentPay, an AI payment agent that helps users manage USDC payments, wallets, and transactions.

CRITICAL: You MUST ONLY answer questions and provide assistance related to OmniAgent Pay functionality. This includes:
- Payment operations (creating, executing, approving payments)
- Wallet management (checking balances, listing wallets)
- Transaction history and payment intents
- Guard system and payment compliance
- USDC transfers and blockchain operations
- Payment simulation and validation

STRICT RESTRICTIONS:
1. You MUST NOT answer questions about:
   - General knowledge, trivia, or unrelated topics
   - Other payment systems or cryptocurrencies (except USDC in context of OmniAgent Pay)
   - Programming help unrelated to OmniAgent Pay
   - Personal advice, health, legal, or financial advice outside of OmniAgent Pay
   - Any topic not directly related to OmniAgent Pay operations

2. When asked about unrelated topics, politely decline with:
   "I'm specialized in OmniAgent Pay operations only. I can help you with payments, wallets, transactions, and payment intents. How can I assist you with OmniAgent Pay?"

3. Stay focused on your core capabilities:
   - Check wallet balances
   - Create and execute payments
   - List transactions and payment intents
   - Simulate payments to check guard compliance
   - Approve payments that require authorization

Important operational rules:
1. Always simulate payments before executing them
2. Explain what you're doing before taking payment actions
3. If a payment requires approval, inform the user and wait for confirmation
4. Be concise but helpful in your responses
5. When creating payments, always provide clear descriptions
6. If you don't have enough information (like wallet ID), ask the user

You have access to payment tools - use them to help users with their OmniAgent Pay needs only.`;

export const geminiService = {
  /**
   * Check if Gemini is configured
   */
  isConfigured(): boolean {
    return !!GEMINI_API_KEY && !!genAI;
  },

  /**
   * Send a chat message to Gemini and get response
   */
  async chat(messages: ChatMessage[]): Promise<{
    content: string;
    toolCalls?: Array<{
      tool: string;
      input: Record<string, unknown>;
      output: unknown;
    }>;
  }> {
    if (!genAI) {
      throw new Error('Gemini API key not configured. Please set VITE_GEMINI_API_KEY environment variable.');
    }

    // Check rate limit before making API call
    const rateLimitCheck = checkRateLimit();
    if (!rateLimitCheck.allowed) {
      const error = new Error(rateLimitCheck.reason || 'Rate limit exceeded');
      (error as any).rateLimitInfo = {
        retryAfter: rateLimitCheck.retryAfter,
        limits: rateLimitCheck.limits,
      };
      throw error;
    }

    // Record the request
    recordRequest();

    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      tools: [{ functionDeclarations: paymentTools }],
      systemInstruction: SYSTEM_PROMPT,
    });

    // Convert messages to Gemini format
    const history = messagesToGeminiHistory(messages);
    
    // Get the last message (should be user message)
    const lastMessage = messages[messages.length - 1];
    
    // Ensure last message is from user
    if (lastMessage.role !== 'user') {
      throw new Error('Last message must be from user');
    }
    
    // Start chat session with history (all messages except the last one)
    // If history is empty or only has one message, start with empty history
    const chatHistory = history.length > 1 ? history.slice(0, -1) : [];
    
    const chat = model.startChat({
      history: chatHistory,
    });

    const result = await chat.sendMessage(lastMessage.content);

    const response = result.response;
    const toolCalls: Array<{
      tool: string;
      input: Record<string, unknown>;
      output: unknown;
    }> = [];

    // Handle function calls
    if (response.functionCalls() && response.functionCalls().length > 0) {
      const functionCalls = response.functionCalls();
      
      // Execute all tool calls
      for (const funcCall of functionCalls) {
        const toolName = funcCall.name;
        const args = funcCall.args as Record<string, unknown>;
        
        const output = await executeToolCall(toolName, args);
        
        toolCalls.push({
          tool: toolName,
          input: args,
          output,
        });
      }

      // Send tool results back to Gemini for final response
      const toolResults = functionCalls.map((funcCall, idx) => ({
        functionResponse: {
          name: funcCall.name,
          response: toolCalls[idx].output,
        },
      }));

      const finalResult = await chat.sendMessage(toolResults);
      const finalResponse = finalResult.response;
      
      return {
        content: finalResponse.text(),
        toolCalls,
      };
    }

    // No function calls, just return text response
    return {
      content: response.text(),
    };
  },

  /**
   * Stream chat response for real-time updates
   */
  async *chatStream(messages: ChatMessage[]): AsyncGenerator<string, void, unknown> {
    if (!genAI) {
      throw new Error('Gemini API key not configured. Please set VITE_GEMINI_API_KEY environment variable.');
    }

    // Check rate limit before making API call
    const rateLimitCheck = checkRateLimit();
    if (!rateLimitCheck.allowed) {
      const error = new Error(rateLimitCheck.reason || 'Rate limit exceeded');
      (error as any).rateLimitInfo = {
        retryAfter: rateLimitCheck.retryAfter,
        limits: rateLimitCheck.limits,
      };
      throw error;
    }

    // Record the request
    recordRequest();

    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      tools: [{ functionDeclarations: paymentTools }],
      systemInstruction: SYSTEM_PROMPT,
    });

    const history = messagesToGeminiHistory(messages);
    
    // Get the last message (should be user message)
    const lastMessage = messages[messages.length - 1];
    
    // Ensure last message is from user
    if (lastMessage.role !== 'user') {
      throw new Error('Last message must be from user');
    }
    
    // Start chat session with history (all messages except the last one)
    const chatHistory = history.length > 1 ? history.slice(0, -1) : [];
    
    const chat = model.startChat({
      history: chatHistory,
    });

    const result = await chat.sendMessageStream(lastMessage.content);

    // Stream the response
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        yield chunkText;
      }
    }
  },
};
