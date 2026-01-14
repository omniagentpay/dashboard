import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { StatusChip } from '@/components/StatusChip';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowRight, Info, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { crosschainService } from '@/services/crosschain';
import type { ChainId, RouteType, CrossChainTransfer } from '@/types';
import { cn } from '@/lib/utils';

const CHAINS = crosschainService.getChainNames();
const ROUTES = crosschainService.getRouteInfo();

export default function CrossChainPage() {
  const [sourceChain, setSourceChain] = useState<ChainId>('ethereum');
  const [destChain, setDestChain] = useState<ChainId>('polygon');
  const [amount, setAmount] = useState('');
  const [destAddress, setDestAddress] = useState('');
  const [selectedRoute, setSelectedRoute] = useState<RouteType>('auto');
  const [routeEstimate, setRouteEstimate] = useState<{
    route: RouteType;
    explanation: string;
    eta: string;
    fee: number;
    steps: string[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [transfers, setTransfers] = useState<CrossChainTransfer[]>([]);

  useEffect(() => {
    loadTransfers();
  }, []);

  const loadTransfers = async () => {
    try {
      const data = await crosschainService.getTransfers();
      setTransfers(data);
    } catch (error) {
      console.error('Failed to load transfers:', error);
    }
  };

  const handleEstimate = async () => {
    if (!amount) return;
    setLoading(true);
    const estimate = await crosschainService.estimateRoute(
      sourceChain,
      destChain,
      parseFloat(amount),
      selectedRoute
    );
    setRouteEstimate(estimate);
    setLoading(false);
  };

  const handleInitiate = async () => {
    if (!amount || !routeEstimate) return;
    setLoading(true);
    try {
      await crosschainService.initiateTransfer({
        sourceChain,
        destinationChain: destChain,
        amount: parseFloat(amount),
        destinationAddress: destAddress || 'Same as source',
        route: routeEstimate.route,
      });
      // Reset form
      setAmount('');
      setDestAddress('');
      setRouteEstimate(null);
      // Reload transfers
      await loadTransfers();
    } catch (error) {
      console.error('Failed to initiate transfer:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Cross-chain Transfers"
        description="Bridge USDC across chains using CCTP and Gateway"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Transfer Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">New Transfer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Chain Selection */}
              <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-end">
                <div className="space-y-2">
                  <Label>Source Chain</Label>
                  <Select value={sourceChain} onValueChange={(v) => setSourceChain(v as ChainId)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CHAINS).map(([id, name]) => (
                        <SelectItem key={id} value={id} disabled={id === destChain}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="pb-2">
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <Label>Destination Chain</Label>
                  <Select value={destChain} onValueChange={(v) => setDestChain(v as ChainId)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CHAINS).map(([id, name]) => (
                        <SelectItem key={id} value={id} disabled={id === sourceChain}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label>Amount (USDC)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              {/* Destination Address */}
              <div className="space-y-2">
                <Label>Destination Address (optional)</Label>
                <Input
                  placeholder="Leave empty to use same address"
                  value={destAddress}
                  onChange={(e) => setDestAddress(e.target.value)}
                />
              </div>

              {/* Route Selection */}
              <div className="space-y-2">
                <Label>Route Preference</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.entries(ROUTES).map(([id, info]) => (
                    <button
                      key={id}
                      onClick={() => setSelectedRoute(id as RouteType)}
                      className={cn(
                        'p-3 rounded-lg border text-left transition-colors',
                        selectedRoute === id
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-muted'
                      )}
                    >
                      <p className="font-medium text-sm">{info.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {info.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleEstimate}
                disabled={!amount || loading}
                className="w-full"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Get Route Quote
              </Button>
            </CardContent>
          </Card>

          {/* Route Explanation */}
          {routeEstimate && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Route Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Route</p>
                    <p className="font-medium">{ROUTES[routeEstimate.route].name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Estimated Time</p>
                    <p className="font-medium">{routeEstimate.eta}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Fee</p>
                    <p className="font-medium">${routeEstimate.fee.toFixed(2)}</p>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm">{routeEstimate.explanation}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-2">Steps</p>
                  <div className="space-y-2">
                    {routeEstimate.steps.map((step, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <span className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs">
                          {idx + 1}
                        </span>
                        {step}
                      </div>
                    ))}
                  </div>
                </div>

                <Button onClick={handleInitiate} className="w-full" disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Initiate Transfer
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Transfers */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Transfers</CardTitle>
            </CardHeader>
            <CardContent>
              {transfers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No transfers yet
                </p>
              ) : (
                <div className="space-y-4">
                  {transfers.map((transfer) => (
                    <div key={transfer.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          ${transfer.amount.toLocaleString()} USDC
                        </span>
                        <StatusChip status={transfer.status} />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="capitalize">{transfer.sourceChain}</span>
                        <ArrowRight className="h-3 w-3" />
                        <span className="capitalize">{transfer.destinationChain}</span>
                      </div>
                      
                      {/* Steps timeline */}
                      <div className="mt-3 space-y-1">
                        {transfer.steps.map((step, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs">
                            {step.status === 'completed' ? (
                              <CheckCircle className="h-3 w-3 text-success" />
                            ) : step.status === 'in_progress' ? (
                              <Loader2 className="h-3 w-3 animate-spin text-primary" />
                            ) : (
                              <Clock className="h-3 w-3 text-muted-foreground" />
                            )}
                            <span className={step.status === 'pending' ? 'text-muted-foreground' : ''}>
                              {step.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
