import type { Wallet } from '@/types';
import { apiClient } from '@/lib/api-client';

export const walletsService = {
  async getWallets(): Promise<Wallet[]> {
    return apiClient.get<Wallet[]>('/wallets');
  },

  async getWallet(id: string): Promise<Wallet | null> {
    try {
      return await apiClient.get<Wallet>(`/wallets/${id}`);
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  },

  async createWallet(data: {
    name: string;
    chain: Wallet['chain'];
    address?: string;
  }): Promise<Wallet> {
    return apiClient.post<Wallet>('/wallets', data);
  },

  async fundWallet(id: string, amount: number): Promise<boolean> {
    // Fund wallet endpoint to be implemented
    throw new Error('Fund wallet not yet implemented');
  },

  async getUnifiedBalance(): Promise<{ total: number; byChain: Record<string, number> }> {
    const result = await apiClient.get<{ total: number; by_chain: Record<string, number> }>('/wallets/balance/unified');
    return {
      total: result.total,
      byChain: result.by_chain,
    };
  },
};
