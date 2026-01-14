interface McpResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

export async function callMcpTool(tool: string, params: Record<string, unknown>): Promise<McpResponse> {
  const mcpServerUrl = process.env.MCP_SERVER_URL;
  const mcpApiKey = process.env.MCP_API_KEY;
  
  if (!mcpServerUrl) {
    return {
      success: false,
      error: 'MCP server not configured. Please set MCP_SERVER_URL or use SDK directly.',
    };
  }
  
  try {
    const response = await fetch(`${mcpServerUrl}/tools/${tool}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(mcpApiKey && { Authorization: `Bearer ${mcpApiKey}` }),
      },
      body: JSON.stringify(params),
    });
    
    if (!response.ok) {
      const error = await response.text();
      return { success: false, error };
    }
    
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function getMcpTools(): Promise<Array<{ name: string; description: string; parameters: unknown }>> {
  const mcpServerUrl = process.env.MCP_SERVER_URL;
  
  if (mcpServerUrl) {
    try {
      const response = await fetch(`${mcpServerUrl}/tools`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Failed to fetch MCP tools:', error);
    }
  }
  
  return [
    {
      name: 'check_balance',
      description: 'Check the USDC balance of a wallet',
      parameters: [
        { name: 'wallet_id', type: 'string', required: true },
        { name: 'chain', type: 'string', required: false },
      ],
    },
    {
      name: 'simulate',
      description: 'Simulate a payment before execution',
      parameters: [
        { name: 'amount', type: 'number', required: true },
        { name: 'recipient', type: 'string', required: true },
        { name: 'wallet_id', type: 'string', required: true },
      ],
    },
    {
      name: 'pay',
      description: 'Execute a payment',
      parameters: [
        { name: 'intent_id', type: 'string', required: true },
      ],
    },
    {
      name: 'history',
      description: 'Get transaction history',
      parameters: [
        { name: 'wallet_id', type: 'string', required: false },
        { name: 'limit', type: 'number', required: false },
      ],
    },
    {
      name: 'bridge',
      description: 'Bridge assets between chains',
      parameters: [
        { name: 'source_chain', type: 'string', required: true },
        { name: 'dest_chain', type: 'string', required: true },
        { name: 'amount', type: 'number', required: true },
      ],
    },
    {
      name: 'unified_balance',
      description: 'Get aggregated balance across all chains',
      parameters: [],
    },
  ];
}
