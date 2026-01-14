import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { MetricCard } from '@/components/MetricCard';
import { StatusChip } from '@/components/StatusChip';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { AgentStatusBanner } from '@/components/AgentStatusBanner';
import { SpendTrendChart } from '@/components/charts/SpendTrendChart';
import { BudgetHealthRadial } from '@/components/charts/BudgetHealthRadial';
import { SuccessRateDonut } from '@/components/charts/SuccessRateDonut';
import { ActivitySparkline } from '@/components/charts/ActivitySparkline';
import { 
  DollarSign, 
  Wallet, 
  TrendingUp, 
  AlertCircle,
  ArrowRight,
  Clock,
  CheckCircle2,
  Zap
} from 'lucide-react';
import { paymentsService } from '@/services/payments';
import { walletsService } from '@/services/wallets';
import { agentsService } from '@/services/agents';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import type { PaymentIntent, Transaction } from '@/types';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [pendingIntents, setPendingIntents] = useState<PaymentIntent[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [agentsRequiringAttention, setAgentsRequiringAttention] = useState(0);
  const [metrics, setMetrics] = useState({
    spendToday: 0,
    remainingBudget: 0,
    successRate: 0,
    activeWallets: 0,
    pendingApprovals: 0,
    totalTransactions: 0,
  });
  const [spendTrendData, setSpendTrendData] = useState<Array<{ time: string; value: number }>>([]);
  const [activitySparklineData, setActivitySparklineData] = useState<Array<{ time: string; count: number }>>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Fetch all transactions for trend calculations, but limit display to 5
      const [intents, allTransactions, wallets, agents] = await Promise.all([
        paymentsService.getIntents(),
        paymentsService.getTransactions({ limit: 1000 }), // Get enough for trend data
        walletsService.getWallets(),
        agentsService.getAgents().catch(() => []), // Gracefully handle if agents service fails
      ]);

      const pending = intents.filter(i => i.status === 'awaiting_approval');
      setPendingIntents(pending);

      // Calculate agents requiring attention (flagged agents or agents with pending approvals)
      const flaggedAgents = agents.filter(a => a.trustLevel === 'flagged').length;
      const agentsWithPendingApprovals = new Set(
        pending.filter(i => i.agentId).map(i => i.agentId!)
      ).size;
      setAgentsRequiringAttention(Math.max(flaggedAgents, agentsWithPendingApprovals));

      const recent = allTransactions.slice(0, 5);
      setRecentTransactions(recent);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTxs = allTransactions.filter(tx => {
        const txDate = new Date(tx.createdAt);
        return txDate >= today && tx.status === 'succeeded';
      });
      const spendToday = todayTxs.reduce((sum, tx) => sum + tx.amount, 0);
      const successCount = allTransactions.filter(tx => tx.status === 'succeeded').length;
      const successRate = allTransactions.length > 0 ? (successCount / allTransactions.length) * 100 : 0;

      setMetrics({
        spendToday,
        remainingBudget: 3000 - spendToday,
        successRate: Math.round(successRate * 10) / 10,
        activeWallets: wallets.filter(w => w.status === 'active').length,
        pendingApprovals: pending.length,
        totalTransactions: allTransactions.length,
      });

      // Generate spend trend data (last 24 hours, hourly buckets)
      const now = new Date();
      const trendData = [];
      for (let i = 23; i >= 0; i--) {
        const hour = new Date(now);
        hour.setHours(now.getHours() - i, 0, 0, 0);
        const hourTxs = allTransactions.filter(tx => {
          const txDate = new Date(tx.createdAt);
          return txDate >= hour && txDate < new Date(hour.getTime() + 3600000) && tx.status === 'succeeded';
        });
        const hourSpend = hourTxs.reduce((sum, tx) => sum + tx.amount, 0);
        trendData.push({
          time: hour.getHours().toString().padStart(2, '0') + ':00',
          value: hourSpend,
        });
      }
      setSpendTrendData(trendData);

      // Generate activity sparkline data (last 7 days)
      const sparklineData = [];
      for (let i = 6; i >= 0; i--) {
        const day = new Date(now);
        day.setDate(now.getDate() - i);
        day.setHours(0, 0, 0, 0);
        const nextDay = new Date(day);
        nextDay.setDate(day.getDate() + 1);
        const dayTxs = allTransactions.filter(tx => {
          const txDate = new Date(tx.createdAt);
          return txDate >= day && txDate < nextDay;
        });
        sparklineData.push({
          time: day.toLocaleDateString('en-US', { weekday: 'short' }),
          count: dayTxs.length,
        });
      }
      setActivitySparklineData(sparklineData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Dashboard" description="Overview of your payment operations" />
        <LoadingSkeleton variant="metric" count={4} className="mb-6" />
        <LoadingSkeleton variant="card" count={2} />
      </div>
    );
  }

  const hasExecutions = metrics.totalTransactions > 0;
  const hasWallets = metrics.activeWallets > 0;

  // Generate micro-events from recent transactions and intents
  const generateMicroEvents = () => {
    const events: Array<{ id: string; type: string; message: string; timestamp: Date }> = [];
    
    // Add events from recent transactions
    recentTransactions.slice(0, 3).forEach((tx) => {
      if (tx.type === 'payment') {
        events.push({
          id: `event_${tx.id}_payment`,
          type: 'payment',
          message: 'Agent simulated payment',
          timestamp: new Date(tx.createdAt),
        });
      }
    });

    // Add guard events from pending intents
    pendingIntents.slice(0, 2).forEach((intent) => {
      const allGuardsPassed = intent.guardResults.length > 0 && intent.guardResults.every(r => r.passed);
      if (allGuardsPassed) {
        events.push({
          id: `event_${intent.id}_guard`,
          type: 'guard',
          message: 'Guard auto-approved',
          timestamp: new Date(intent.updatedAt),
        });
      }
      if (intent.route) {
        events.push({
          id: `event_${intent.id}_route`,
          type: 'route',
          message: `Route selected: ${intent.route.toUpperCase()}`,
          timestamp: new Date(intent.updatedAt),
        });
      }
    });

    // Sort by timestamp and take most recent 5
    return events
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 5);
  };

  const microEvents = generateMicroEvents();

  return (
    <div>
      <PageHeader 
        title="Dashboard" 
        description="Overview of your payment operations"
      />

      {/* Hero Status Banner */}
      <AgentStatusBanner agentsRequiringAttention={agentsRequiringAttention} />

      {/* Metrics Grid - Equal height cards enforced */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <MetricCard
          label="Spend Today"
          value={`$${metrics.spendToday.toLocaleString()}`}
          icon={DollarSign}
          bottomContent={<SpendTrendChart data={spendTrendData} />}
        />
        <MetricCard
          label="Remaining Budget"
          value={`$${metrics.remainingBudget.toLocaleString()}`}
          subValue={(() => {
            const usedPercent = (metrics.spendToday / 3000) * 100;
            const thresholdPercent = (2400 / 3000) * 100;
            const isWithinSafeLimits = usedPercent < thresholdPercent;
            return `Daily limit${isWithinSafeLimits ? ' • Within safe limits' : ''}`;
          })()}
          chart={
            <BudgetHealthRadial
              used={metrics.spendToday}
              remaining={metrics.remainingBudget}
              threshold={2400}
              total={3000}
            />
          }
        />
        <MetricCard
          label="Success Rate"
          value={hasExecutions ? `${metrics.successRate}%` : '—'}
          subValue={hasExecutions ? undefined : 'No executions yet • System is idle and within limits'}
          chart={
            <SuccessRateDonut
              successRate={metrics.successRate}
              totalExecutions={metrics.totalTransactions}
            />
          }
        />
        <MetricCard
          label="Active Wallets"
          value={hasWallets ? metrics.activeWallets : '—'}
          subValue={hasWallets ? undefined : 'No wallets currently exposed'}
          icon={Wallet}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Approvals */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2">
            <CardTitle className="text-base font-semibold">Pending Approvals</CardTitle>
            <Link to="/app/intents">
              <Button variant="ghost" size="sm" className="text-xs touch-manipulation">
                View all <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {pendingIntents.length === 0 ? (
              <div className="py-6 text-center">
                <CheckCircle2 className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium text-foreground mb-1">No pending approvals</p>
                <p className="text-xs text-muted-foreground">
                  Guard policies are auto-handling spend
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingIntents.map((intent) => (
                  <div
                    key={intent.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center shrink-0">
                        <Clock className="h-5 w-5 text-warning" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm break-words">${intent.amount.toLocaleString()} to {intent.recipient}</p>
                        <p className="text-xs text-muted-foreground break-words">{intent.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusChip status={intent.status} />
                      <Link to={`/app/intents/${intent.id}`}>
                        <Button size="sm" variant="outline" className="touch-manipulation">
                          Review
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2">
            <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
            <Link to="/app/transactions">
              <Button variant="ghost" size="sm" className="text-xs touch-manipulation">
                View all <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <ActivitySparkline data={activitySparklineData} />
            </div>
            {recentTransactions.length === 0 && microEvents.length === 0 ? (
              <div className="py-6 text-center">
                <Zap className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium text-foreground mb-1">No recent activity</p>
                <p className="text-xs text-muted-foreground">
                  System is idle and within limits
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Show micro-events first if available */}
                {microEvents.length > 0 && (
                  <>
                    {microEvents.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center gap-3 py-1.5 text-xs"
                      >
                        <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-muted-foreground break-words">
                            {event.message}
                          </p>
                        </div>
                        <p className="text-muted-foreground/70 shrink-0">
                          {formatDistanceToNow(event.timestamp, { addSuffix: true })}
                        </p>
                      </div>
                    ))}
                    {recentTransactions.length > 0 && <div className="border-t my-2" />}
                  </>
                )}
                {/* Show transaction details */}
                {recentTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between gap-3 py-2 border-b last:border-0"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`h-2 w-2 rounded-full shrink-0 ${
                        tx.status === 'succeeded' ? 'bg-success' :
                        tx.status === 'pending' ? 'bg-warning' :
                        'bg-destructive'
                      }`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium break-words">
                          {tx.type === 'payment' ? `Payment to ${tx.recipient}` :
                           tx.type === 'fund' ? 'Wallet funded' :
                           tx.type === 'bridge' ? 'Bridge transfer' :
                           'Transfer'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(tx.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium whitespace-nowrap">
                        {tx.type === 'fund' ? '+' : '-'}${tx.amount.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground uppercase">{tx.chain}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
