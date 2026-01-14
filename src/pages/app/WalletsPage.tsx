import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { StatusChip } from '@/components/StatusChip';
import { CopyButton } from '@/components/CopyButton';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Wallet, ExternalLink, ArrowUpRight } from 'lucide-react';
import { walletsService } from '@/services/wallets';
import type { Wallet as WalletType, ChainId } from '@/types';

const CHAINS: { value: ChainId; label: string }[] = [
  { value: 'ethereum', label: 'Ethereum' },
  { value: 'polygon', label: 'Polygon' },
  { value: 'arbitrum', label: 'Arbitrum' },
  { value: 'optimism', label: 'Optimism' },
  { value: 'base', label: 'Base' },
  { value: 'avalanche', label: 'Avalanche' },
];

export default function WalletsPage() {
  const [wallets, setWallets] = useState<WalletType[]>([]);
  const [loading, setLoading] = useState(true);
  const [unifiedBalance, setUnifiedBalance] = useState<{ total: number; byChain: Record<string, number> } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newWalletName, setNewWalletName] = useState('');
  const [newWalletChain, setNewWalletChain] = useState<ChainId>('ethereum');
  const [newWalletAddress, setNewWalletAddress] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [walletsData, balanceData] = await Promise.all([
      walletsService.getWallets(),
      walletsService.getUnifiedBalance(),
    ]);
    setWallets(walletsData);
    setUnifiedBalance(balanceData);
    setLoading(false);
  };

  const handleCreateWallet = async () => {
    if (!newWalletName.trim()) return;
    setCreating(true);
    try {
      await walletsService.createWallet({ 
        name: newWalletName, 
        chain: newWalletChain,
        address: newWalletAddress.trim() || undefined,
      });
      await loadData();
      setCreateOpen(false);
      setNewWalletName('');
      setNewWalletAddress('');
    } catch (error) {
      console.error('Failed to create wallet:', error);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Wallets" />
        <LoadingSkeleton variant="metric" count={1} className="mb-6 max-w-sm" />
        <LoadingSkeleton variant="card" count={3} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Wallets"
        description="Manage your payment wallets across chains"
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Wallet
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Wallet</DialogTitle>
                <DialogDescription>
                  Create a new wallet for receiving and sending payments.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Wallet Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Treasury Wallet"
                    value={newWalletName}
                    onChange={(e) => setNewWalletName(e.target.value)}
                    disabled={creating}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chain">Chain *</Label>
                  <Select 
                    value={newWalletChain} 
                    onValueChange={(v) => setNewWalletChain(v as ChainId)}
                    disabled={creating}
                  >
                    <SelectTrigger id="chain">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CHAINS.map((chain) => (
                        <SelectItem key={chain.value} value={chain.value}>
                          {chain.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Wallet Address (Optional)</Label>
                  <Input
                    id="address"
                    placeholder="0x... (leave empty to generate new wallet)"
                    value={newWalletAddress}
                    onChange={(e) => setNewWalletAddress(e.target.value)}
                    disabled={creating}
                  />
                  <p className="text-xs text-muted-foreground">
                    Import an existing wallet by entering its address, or leave empty to create a new one
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setCreateOpen(false);
                    setNewWalletName('');
                    setNewWalletAddress('');
                  }}
                  disabled={creating}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateWallet} 
                  disabled={!newWalletName.trim() || creating}
                >
                  {creating ? 'Creating...' : 'Create Wallet'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Unified Balance */}
      {unifiedBalance && (
        <Card className="mb-6 max-w-md">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground mb-1">Total Balance (All Chains)</p>
            <p className="text-3xl font-semibold">${unifiedBalance.total.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">USDC</p>
          </CardContent>
        </Card>
      )}

      {/* Wallet Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {wallets.map((wallet) => (
          <Card key={wallet.id} className="hover:shadow-sm transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Wallet className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{wallet.name}</CardTitle>
                    <p className="text-xs text-muted-foreground capitalize">{wallet.chain}</p>
                  </div>
                </div>
                <StatusChip status={wallet.status} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">USDC Balance</p>
                  <p className="text-xl font-semibold">${wallet.balance.usdc.toLocaleString()}</p>
                </div>
                
                <div>
                  <p className="text-xs text-muted-foreground">Address</p>
                  <div className="flex items-center gap-1">
                    <code className="text-xs font-mono">{wallet.address}</code>
                    <CopyButton value={wallet.address} />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Link to={`/app/wallets/${wallet.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Details
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" className="flex-1">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    Fund
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
