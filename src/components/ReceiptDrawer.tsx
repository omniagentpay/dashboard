import { useState, useEffect } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { FileText, CheckCircle, XCircle, Clock, ArrowRight } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { formatDistanceToNow } from 'date-fns';

interface Receipt {
  receiptId: string;
  intentId?: string;
  transactionId?: string;
  summary: string;
  why: {
    trigger: string;
    guardOutcome: string;
    route: string;
    amount: number;
    destination: string;
  };
  toolTrace?: Array<{
    step: string;
    timestamp: string;
    result: string;
  }>;
  createdAt: string;
}

interface ReceiptDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  intentId?: string;
  transactionId?: string;
}

export function ReceiptDrawer({ open, onOpenChange, intentId, transactionId }: ReceiptDrawerProps) {
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && (intentId || transactionId)) {
      loadReceipt();
    } else {
      setReceipt(null);
      setError(null);
    }
  }, [open, intentId, transactionId]);

  const loadReceipt = async () => {
    setLoading(true);
    setError(null);
    try {
      let receiptData: Receipt;
      
      if (transactionId) {
        const response = await apiClient.post<Receipt>(`/receipts/from-transaction/${transactionId}`, {});
        receiptData = response;
      } else if (intentId) {
        const response = await apiClient.post<Receipt>(`/receipts/from-intent/${intentId}`, {});
        receiptData = response;
      } else {
        throw new Error('Either intentId or transactionId is required');
      }
      
      setReceipt(receiptData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load receipt');
      console.error('Failed to load receipt:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Payment Receipt
          </DrawerTitle>
          <DrawerDescription>
            AI-generated explanation of this payment
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-4 overflow-y-auto">
          {loading ? (
            <LoadingSkeleton variant="card" count={3} />
          ) : error ? (
            <div className="text-sm text-destructive py-4">{error}</div>
          ) : receipt ? (
            <div className="space-y-6">
              {/* Summary */}
              <div>
                <h3 className="text-sm font-medium mb-2">Summary</h3>
                <p className="text-sm text-muted-foreground">{receipt.summary}</p>
              </div>

              <Separator />

              {/* Why it happened */}
              <div>
                <h3 className="text-sm font-medium mb-3">Why it happened</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <ArrowRight className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div className="flex-1">
                      <span className="text-sm font-medium">Trigger:</span>
                      <p className="text-sm text-muted-foreground">{receipt.why.trigger}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div className="flex-1">
                      <span className="text-sm font-medium">Guard Outcome:</span>
                      <p className="text-sm text-muted-foreground">{receipt.why.guardOutcome}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <ArrowRight className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div className="flex-1">
                      <span className="text-sm font-medium">Route:</span>
                      <p className="text-sm text-muted-foreground">{receipt.why.route}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div className="flex-1">
                      <span className="text-sm font-medium">Amount & Destination:</span>
                      <p className="text-sm text-muted-foreground">
                        ${receipt.why.amount} to {receipt.why.destination}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tool Trace */}
              {receipt.toolTrace && receipt.toolTrace.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium mb-3">Tool Trace</h3>
                    <div className="space-y-2">
                      {receipt.toolTrace.map((trace, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 border rounded-md">
                          <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">{trace.step}</span>
                              <Badge variant={trace.result.includes('failed') ? 'destructive' : 'default'}>
                                {trace.result.includes('failed') ? 'Failed' : trace.result.includes('Completed') ? 'Completed' : 'Pending'}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(trace.timestamp), { addSuffix: true })}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">{trace.result}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* IDs */}
              <Separator />
              <div>
                <h3 className="text-sm font-medium mb-2">Identifiers</h3>
                <div className="space-y-1 text-xs font-mono text-muted-foreground">
                  {receipt.receiptId && (
                    <div>Receipt ID: {receipt.receiptId}</div>
                  )}
                  {receipt.intentId && (
                    <div>Intent ID: {receipt.intentId}</div>
                  )}
                  {receipt.transactionId && (
                    <div>Transaction ID: {receipt.transactionId}</div>
                  )}
                  <div>Created: {formatDistanceToNow(new Date(receipt.createdAt), { addSuffix: true })}</div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
