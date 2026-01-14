import type { X402Api, PaymentIntent } from '@/types';
import { paymentsService } from './payments';
import { apiClient } from '@/lib/api-client';

export const x402Service = {
  async getApis(): Promise<X402Api[]> {
    return apiClient.get<X402Api[]>('/x402');
  },

  async getApi(id: string): Promise<X402Api | null> {
    try {
      return await apiClient.get<X402Api>(`/x402/${id}`);
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  },

  async tryApi(apiId: string, walletId: string): Promise<{
    intent: PaymentIntent;
    result?: { data: unknown; latency: number };
  }> {
    const api = await this.getApi(apiId);
    if (!api) throw new Error('API not found');

    const intent = await paymentsService.createIntent({
      amount: api.price,
      recipient: api.provider,
      recipientAddress: `0x${api.provider.toLowerCase().replace(/\s/g, '')}...1234`,
      description: `x402 API call: ${api.name}`,
      walletId,
      chain: 'ethereum',
    });

    const result = await apiClient.post<{ data: unknown; latency: number }>(`/x402/${apiId}/call`, {
      walletId,
    });

    return {
      intent,
      result,
    };
  },

  async searchApis(query: string): Promise<X402Api[]> {
    return apiClient.get<X402Api[]>(`/x402/search?q=${encodeURIComponent(query)}`);
  },
};
