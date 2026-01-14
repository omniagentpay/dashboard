import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle, XCircle, Loader2, Info } from 'lucide-react';
import { guardsService } from '@/services/guards';
import { WhatIfSimulator } from '@/components/WhatIfSimulator';
import { BlastRadiusPreview } from '@/components/BlastRadiusPreview';
import type { GuardConfig, GuardPreset } from '@/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function GuardStudioPage() {
  const { toast } = useToast();
  const [guards, setGuards] = useState<GuardConfig[]>([]);
  const [presets, setPresets] = useState<GuardPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Simulation state
  const [simAmount, setSimAmount] = useState('');
  const [simRecipient, setSimRecipient] = useState('');
  const [simResult, setSimResult] = useState<{
    passed: boolean;
    results: { guard: string; passed: boolean; reason?: string }[];
  } | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [selectedGuardId, setSelectedGuardId] = useState<string | undefined>();

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [guardsData, presetsData] = await Promise.all([
        guardsService.getGuards(),
        guardsService.getPresets(),
      ]);
      setGuards(guardsData);
      setPresets(presetsData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load guards';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleGuard = async (guardId: string, enabled: boolean) => {
    try {
      await guardsService.updateGuard(guardId, { enabled });
      setGuards(guards.map(g => g.id === guardId ? { ...g, enabled } : g));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update guard';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleUpdateLimit = async (guardId: string, limit: number) => {
    const guard = guards.find(g => g.id === guardId);
    if (!guard || isNaN(limit)) return;
    try {
      await guardsService.updateGuard(guardId, { 
        config: { ...(guard.config || {}), limit } 
      });
      setGuards(guards.map(g => 
        g.id === guardId ? { ...g, config: { ...(g.config || {}), limit } } : g
      ));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update guard limit';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleApplyPreset = async (presetId: string) => {
    try {
      setSaving(true);
      await guardsService.applyPreset(presetId);
      await loadData();
      toast({
        title: 'Success',
        description: 'Guard preset applied successfully',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to apply preset';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSimulate = async () => {
    if (!simAmount) return;
    try {
      setSimulating(true);
      const result = await guardsService.simulatePolicy(
        parseFloat(simAmount),
        simRecipient || 'unknown'
      );
      setSimResult(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to simulate policy';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setSimulating(false);
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Guard Studio" />
        <LoadingSkeleton variant="card" count={3} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Guard Studio"
        description="Configure payment policies and spending limits"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Guards Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Presets */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Guard Preset Studio</CardTitle>
              <CardDescription>
                Apply predefined security configurations with one click
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {presets && presets.length > 0 ? presets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleApplyPreset(preset.id)}
                    disabled={saving}
                    className={cn(
                      'p-4 rounded-lg border text-left transition-colors hover:bg-muted',
                      'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
                    )}
                  >
                    <p className="font-medium text-sm mb-1">{preset.name}</p>
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {preset.description}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                      <Info className="h-3 w-3" />
                      <span className="line-clamp-1">{preset.philosophy}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {preset.thresholds?.dailyBudget && (
                        <Badge variant="outline" className="text-xs">
                          ${preset.thresholds.dailyBudget}/day
                        </Badge>
                      )}
                      {preset.thresholds?.singleTxLimit && (
                        <Badge variant="outline" className="text-xs">
                          ${preset.thresholds.singleTxLimit}/tx
                        </Badge>
                      )}
                      {preset.thresholds?.autoApproveThreshold !== undefined && (
                        <Badge variant="outline" className="text-xs">
                          Auto: ${preset.thresholds.autoApproveThreshold}
                        </Badge>
                      )}
                    </div>
                  </button>
                )) : (
                  <div className="col-span-2 text-sm text-muted-foreground text-center py-4">
                    No presets available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Individual Guards */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Guard Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {guards && guards.length > 0 ? guards.map((guard, index) => (
                <div key={guard.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Shield className={cn(
                        'h-5 w-5',
                        guard.enabled ? 'text-primary' : 'text-muted-foreground'
                      )} />
                      <div>
                        <p className="font-medium text-sm">{guard.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {guard.type.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={guard.enabled}
                      onCheckedChange={(checked) => handleToggleGuard(guard.id, checked)}
                    />
                  </div>
                  
                  {guard.enabled && (guard.type === 'budget' || guard.type === 'single_tx' || guard.type === 'rate_limit' || guard.type === 'auto_approve') && (
                    <div className="ml-8 space-y-2">
                      <div className="flex items-center gap-3">
                        <Label className="text-xs text-muted-foreground whitespace-nowrap">
                          {guard.type === 'budget' ? 'Daily limit:' :
                           guard.type === 'single_tx' ? 'Max per tx:' :
                           guard.type === 'rate_limit' ? 'Max per hour:' :
                           'Auto-approve below:'}
                        </Label>
                        <div className="flex items-center gap-2">
                          {guard.type !== 'rate_limit' && <span className="text-sm">$</span>}
                          <Input
                            type="number"
                            value={guard.config?.limit || guard.config?.threshold || ''}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value);
                              if (!isNaN(value)) {
                                handleUpdateLimit(guard.id, value);
                              }
                            }}
                            className="w-24 h-8"
                            onFocus={() => setSelectedGuardId(guard.id)}
                          />
                          {guard.type === 'rate_limit' && <span className="text-sm text-muted-foreground">tx/hour</span>}
                        </div>
                      </div>
                      {selectedGuardId === guard.id && (
                        <BlastRadiusPreview guardId={guard.id} className="mt-2" />
                      )}
                    </div>
                  )}
                  
                  {index < guards.length - 1 && (
                    <Separator className="mt-4" />
                  )}
                </div>
              )) : (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No guards configured
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* What-If Simulation Panel */}
        <div>
          <WhatIfSimulator />
        </div>
      </div>
    </div>
  );
}
