import type { Wallet } from '@/types';
import { apiClient } from '@/lib/api-client';

export const walletsService = {
  async getWallets(walletAddresses?: string[]): Promise<Wallet[]> {
    const params = walletAddresses && walletAddresses.length > 0
      ? { addresses: walletAddresses }
      : {};
    return apiClient.get<Wallet[]>('/wallets', { params });
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

  async getUnifiedBalance(walletAddresses?: string[]): Promise<{ total: number; byChain: Record<string, number> }> {
    const params = walletAddresses && walletAddresses.length > 0
      ? { addresses: walletAddresses }
      : {};
    const result = await apiClient.get<{ total: number; by_chain: Record<string, number> }>('/wallets/balance/unified', { params });
    return {
      total: result.total,
      byChain: result.by_chain,
    };
  },

  async getWalletBalance(id: string): Promise<{
    walletId: string;
    chain: string;
    native: { amount: string; currency: string };
    tokens: Array<{ tokenAddress: string; amount: string; currency: string }>;
  } | null> {
    try {
      return await apiClient.get(`/wallets/${id}/balance`);
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  },

  async getWalletNetworks(id: string): Promise<string[]> {
    try {
      const result = await apiClient.get<{ networks: string[] }>(`/wallets/${id}/networks`);
      return result.networks;
    } catch (error) {
      console.error('Failed to get wallet networks:', error);
      return [];
    }
  },

  async initializeCircleWallet(description?: string): Promise<Wallet> {
    return apiClient.post<Wallet>('/wallets/circle/initialize', { description });
  },
};
