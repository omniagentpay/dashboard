import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { StatusChip } from '@/components/StatusChip';
import { JsonViewer } from '@/components/JsonViewer';
import { CopyButton } from '@/components/CopyButton';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { PaymentTimeline } from '@/components/PaymentTimeline';
import { ExplainPaymentDrawer } from '@/components/ExplainPaymentDrawer';
import { ApprovalModal } from '@/components/ApprovalModal';
import { IncidentReplay } from '@/components/IncidentReplay';
import { McpSdkContractExplorer } from '@/components/McpSdkContractExplorer';
import { AgentTrustBadge } from '@/components/AgentTrustBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Circle, ArrowLeft, ExternalLink, Info, PlayCircle, Code, FileText } from 'lucide-react';
import { paymentsService } from '@/services/payments';
import { agentsService } from '@/services/agents';
import type { PaymentIntent, ApprovalAction, Agent } from '@/types';
import { cn } from '@/lib/utils';
import { ReceiptDrawer } from '@/components/ReceiptDrawer';

export default function IntentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [intent, setIntent] = useState<PaymentIntent | null>(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [explainDrawerOpen, setExplainDrawerOpen] = useState(false);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [receiptDrawerOpen, setReceiptDrawerOpen] = useState(false);
  const [agent, setAgent] = useState<Agent | null>(null);

  useEffect(() => {
    loadIntent();
  }, [id]);

  const loadIntent = async () => {
    if (!id) return;
    setLoading(true);
    const data = await paymentsService.getIntent(id);
    setIntent(data);
    
    // Load agent if available
    if (data?.agentId) {
      try {
        const agentData = await agentsService.getAgent(data.agentId);
        setAgent(agentData);
      } catch (error) {
        console.error('Failed to load agent:', error);
      }
    }
    
    setLoading(false);
  };

  const handleApprove = async (action: ApprovalAction) => {
    if (!intent) return;
    try {
      if (action === 'approve_once' || action === 'approve_similar_24h') {
        await paymentsService.approveIntent(intent.id);
      }
      // TODO: Handle deny & update guard
      await loadIntent(); // Refresh
    } catch (error) {
      console.error('Failed to approve intent:', error);
      throw error;
    }
  };

  const getApprovalRequest = (): any => {
    if (!intent) return null;
    return {
      intentId: intent.id,
      amount: intent.amount,
      justification: intent.description,
      guardChecks: intent.guardResults,
      routeDetails: {
        route: intent.route || 'auto',
        estimatedFee: 0.5,
        estimatedTime: '2-5 minutes',
      },
    };
  };

  const handleReject = async () => {
    if (!intent) return;
    // Rejection endpoint to be implemented
  };

  const handleExecute = async () => {
    if (!intent) return;
    setExecuting(true);
    try {
      const result = await paymentsService.executeIntent(intent.id);
      if (result.success) {
        await loadIntent(); // Refresh
      }
    } catch (error) {
      console.error('Failed to execute intent:', error);
    } finally {
      setExecuting(false);
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader
          title="Payment Intent"
          breadcrumbs={[
            { label: 'Payment Intents', href: '/app/intents' },
            { label: 'Loading...' },
          ]}
        />
        <LoadingSkeleton variant="card" count={2} />
      </div>
    );
  }

  if (!intent) {
    return (
      <div>
        <PageHeader
          title="Intent Not Found"
          breadcrumbs={[
            { label: 'Payment Intents', href: '/app/intents' },
            { label: 'Not Found' },
          ]}
        />
        <p>The requested payment intent could not be found.</p>
        <Link to="/app/intents">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Intents
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={`Payment to ${intent.recipient}`}
        breadcrumbs={[
          { label: 'Payment Intents', href: '/app/intents' },
          { label: intent.id },
        ]}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setExplainDrawerOpen(true)}
              aria-label="Explain payment"
            >
              <Info className="h-4 w-4 mr-2" />
              Explain
            </Button>
            <Button
              variant="outline"
              onClick={() => setReceiptDrawerOpen(true)}
              aria-label="View receipt"
            >
              <FileText className="h-4 w-4 mr-2" />
              Receipt
            </Button>
            {intent.status === 'awaiting_approval' && (
              <Button
                onClick={() => setApprovalModalOpen(true)}
                aria-label="Approve payment intent"
              >
                Approve
              </Button>
            )}
            {intent.status === 'executing' && (
              <Button
                onClick={handleExecute}
                disabled={executing}
                aria-label="Execute payment intent"
              >
                {executing ? 'Executing...' : 'Execute'}
              </Button>
            )}
          </div>
        }
      />

      <ExplainPaymentDrawer
        intentId={intent.id}
        open={explainDrawerOpen}
        onOpenChange={setExplainDrawerOpen}
      />

      <ReceiptDrawer
        open={receiptDrawerOpen}
        onOpenChange={setReceiptDrawerOpen}
        intentId={intent.id}
      />

      <ApprovalModal
        open={approvalModalOpen}
        onOpenChange={setApprovalModalOpen}
        request={getApprovalRequest()}
        onApprove={handleApprove}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Intent Details</CardTitle>
                <StatusChip status={intent.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="text-xl font-semibold">
                    ${intent.amount.toLocaleString()} {intent.currency}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Chain</p>
                  <p className="text-sm font-medium capitalize">{intent.chain}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Recipient</p>
                  <p className="text-sm font-medium">{intent.recipient}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Address</p>
                  <div className="flex items-center gap-1">
                    <code className="text-xs font-mono">{intent.recipientAddress}</code>
                    <CopyButton value={intent.recipientAddress} />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-xs text-muted-foreground mb-1">Description</p>
                <p className="text-sm">{intent.description}</p>
              </div>

              {intent.agentId && agent && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Agent</p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{agent.name}</span>
                      <AgentTrustBadge agent={agent} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{agent.purpose}</p>
                  </div>
                </>
              )}

              {intent.txHash && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Transaction Hash</p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                        {intent.txHash}
                      </code>
                      <CopyButton value={intent.txHash} />
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Payment Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment Decision Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <PaymentTimeline intentId={intent.id} />
            </CardContent>
          </Card>

          {/* Tabs for additional features */}
          <Tabs defaultValue="replay" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="replay" className="flex items-center gap-2">
                <PlayCircle className="h-4 w-4" />
                Incident Replay
              </TabsTrigger>
              <TabsTrigger value="contract" className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                Contract Explorer
              </TabsTrigger>
            </TabsList>
            <TabsContent value="replay" className="mt-4">
              <IncidentReplay intentId={intent.id} />
            </TabsContent>
            <TabsContent value="contract" className="mt-4">
              <McpSdkContractExplorer intentId={intent.id} />
            </TabsContent>
          </Tabs>

          {/* Metadata */}
          {intent.metadata && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Metadata</CardTitle>
              </CardHeader>
              <CardContent>
                <JsonViewer data={intent.metadata} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Steps Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {intent.steps.map((step, idx) => (
                  <div key={step.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      {step.status === 'completed' ? (
                        <CheckCircle className="h-5 w-5 text-success" />
                      ) : step.status === 'failed' ? (
                        <XCircle className="h-5 w-5 text-destructive" />
                      ) : step.status === 'in_progress' ? (
                        <div className="h-5 w-5 rounded-full border-2 border-primary animate-pulse" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      )}
                      {idx < intent.steps.length - 1 && (
                        <div className={cn(
                          'w-px flex-1 mt-1',
                          step.status === 'completed' ? 'bg-success' : 'bg-border'
                        )} />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className={cn(
                        'text-sm font-medium',
                        step.status === 'pending' && 'text-muted-foreground'
                      )}>
                        {step.name}
                      </p>
                      {step.timestamp && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(step.timestamp).toLocaleTimeString()}
                        </p>
                      )}
                      {step.details && (
                        <p className="text-xs text-destructive mt-1">{step.details}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Guard Results */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Guard Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {intent.guardResults.map((result, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium">{result.guardName}</p>
                      {result.reason && (
                        <p className="text-xs text-muted-foreground">{result.reason}</p>
                      )}
                    </div>
                    {result.passed ? (
                      <CheckCircle className="h-4 w-4 text-success" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
