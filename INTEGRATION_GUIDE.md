# Integration Guide

This guide explains how to connect the application layer to your actual MCP server and SDK implementations.

## Overview

The application has been upgraded from mock data to a real backend architecture:

- ✅ Backend API server with Express.js
- ✅ All frontend services now call backend APIs
- ✅ Payment intent flow (simulate → approve → execute)
- ✅ MCP tool proxy endpoints
- ✅ Guard enforcement and configuration
- ✅ Transaction history with AI receipt summaries
- ✅ Cross-chain routing estimation
- ✅ Wallet management

## Integration Points

### 1. MCP Client Integration

**File:** `server/lib/mcp-client.ts`

Replace the placeholder `callMcpTool` function with your actual MCP client implementation.

**Current placeholder:**
```typescript
export async function callMcpTool(tool: string, params: Record<string, unknown>): Promise<McpResponse> {
  // TODO: Replace with actual MCP client implementation
}
```

**Integration options:**
- If MCP server exposes HTTP API: Use fetch/axios to call the endpoints
- If MCP server uses stdio: Use MCP SDK client (e.g., `@modelcontextprotocol/sdk`)
- If MCP tools are exposed via SDK: Call SDK functions directly

**Example (HTTP-based):**
```typescript
const response = await fetch(`${mcpServerUrl}/tools/${tool}`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${mcpApiKey}` },
  body: JSON.stringify(params),
});
return { success: true, data: await response.json() };
```

### 2. SDK Client Integration

**File:** `server/lib/sdk-client.ts`

Replace placeholder functions with actual SDK calls:

- `simulatePayment()` - Should call SDK's payment simulation
- `executePayment()` - Should call SDK's payment execution
- `estimateCrossChainRoute()` - Should call SDK's routing estimation
- `getTransactionHistory()` - Should call SDK's history function
- `generateReceiptSummary()` - Should call LLM or SDK function for AI summaries

**Example:**
```typescript
import { sdk } from '@omniagentpay/sdk';

export async function simulatePayment(params) {
  return await sdk.simulatePayment(params);
}
```

### 3. Storage Integration

**File:** `server/lib/storage.ts`

Currently uses in-memory storage. For production, replace with a database:

**Option 1: PostgreSQL**
```typescript
import { Pool } from 'pg';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const storage = {
  async getPaymentIntent(id: string) {
    const result = await pool.query('SELECT * FROM payment_intents WHERE id = $1', [id]);
    return result.rows[0];
  },
  // ... other methods
};
```

**Option 2: MongoDB**
```typescript
import { MongoClient } from 'mongodb';
const client = new MongoClient(process.env.MONGODB_URI);

export const storage = {
  async getPaymentIntent(id: string) {
    const db = client.db('omnipay');
    return await db.collection('payment_intents').findOne({ id });
  },
  // ... other methods
};
```

### 4. Environment Variables

**Backend (`server/.env`):**
```env
PORT=3001
MCP_SERVER_URL=https://your-mcp-server.com
MCP_API_KEY=your-mcp-api-key
SDK_API_KEY=your-sdk-api-key
SDK_ENVIRONMENT=production
DATABASE_URL=postgresql://...  # If using database
```

**Frontend (`.env`):**
```env
VITE_API_BASE_URL=http://localhost:3001/api
```

## Testing the Integration

### 1. Test MCP Tools

1. Start the backend server
2. Navigate to `/app/developers` in the frontend
3. Click on tool buttons (check_balance, simulate, etc.)
4. Verify responses come from your MCP server

### 2. Test Payment Flow

1. Create a payment intent via API or UI
2. Simulate the intent - should call SDK `simulatePayment()`
3. Approve the intent (if needed)
4. Execute the intent - should call SDK `executePayment()`
5. Verify transaction appears in history

### 3. Test Guards

1. Navigate to `/app/guards`
2. Update guard limits
3. Simulate a payment - should enforce guard rules
4. Verify guards block/allow payments correctly

## API Response Formats

The backend expects these response formats from MCP/SDK:

### Simulate Payment Response
```typescript
{
  success: boolean;
  estimatedFee: number;
  route: 'x402' | 'transfer' | 'cctp' | 'auto';
  guardResults?: Array<{
    guardId: string;
    guardName: string;
    passed: boolean;
    reason?: string;
  }>;
}
```

### Execute Payment Response
```typescript
{
  success: boolean;
  txHash?: string;
  status: 'succeeded' | 'failed';
  error?: string;
}
```

### Route Estimate Response
```typescript
{
  route: 'auto' | 'cctp' | 'gateway' | 'bridge_kit';
  explanation: string;
  eta: string;
  fee: number;
  steps: string[];
}
```

## Next Steps

1. **Replace MCP client** with your actual implementation
2. **Replace SDK client** with your actual SDK calls
3. **Add database** for persistent storage
4. **Add authentication** if needed
5. **Add error handling** and logging
6. **Add rate limiting** for production
7. **Add monitoring** and metrics

## Troubleshooting

### Backend won't start
- Check that port 3001 is available
- Verify all dependencies are installed (`npm install` in `server/`)

### Frontend can't connect to backend
- Verify `VITE_API_BASE_URL` is set correctly
- Check CORS settings in backend
- Ensure backend is running

### MCP tools return errors
- Verify MCP server is accessible
- Check `MCP_SERVER_URL` and `MCP_API_KEY` environment variables
- Review MCP client implementation in `server/lib/mcp-client.ts`

### SDK calls fail
- Verify SDK is properly initialized
- Check `SDK_API_KEY` environment variable
- Review SDK client implementation in `server/lib/sdk-client.ts`

## Support

For issues or questions:
1. Check the backend logs for error messages
2. Review the API endpoint implementations in `server/routes/`
3. Verify environment variables are set correctly
4. Test MCP/SDK independently before integrating
