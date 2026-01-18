import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/PageHeader';
import { StatusChip } from '@/components/StatusChip';
import { JsonViewer } from '@/components/JsonViewer';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Search, Filter, Download, ExternalLink, FileText } from 'lucide-react';
import { paymentsService } from '@/services/payments';
import type { Transaction } from '@/types';
import { formatDistanceToNow, format } from 'date-fns';
import { CopyButton } from '@/components/CopyButton';
import { ReceiptDrawer } from '@/components/ReceiptDrawer';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [receiptDrawerOpen, setReceiptDrawerOpen] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setLoading(true);
    const data = await paymentsService.getTransactions();
    setTransactions(data);
    setLoading(false);
  };

  const handleExportCsv = async () => {
    const csv = await paymentsService.exportTransactionsCsv(filteredTransactions);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.recipient?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      tx.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div>
        <PageHeader title="Transactions" />
        <LoadingSkeleton variant="table" count={8} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Transactions"
        description="View and export your transaction history"
        actions={
          <Button variant="outline" onClick={handleExportCsv}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-full"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40 touch-manipulation">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="succeeded">Succeeded</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {filteredTransactions.length === 0 ? (
        <EmptyState
          title="No transactions found"
          description="Transactions will appear here once you start making payments"
          variant="search"
        />
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="table-wrapper">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Transaction</TableHead>
                  <TableHead className="min-w-[100px]">Type</TableHead>
                  <TableHead className="min-w-[120px]">Amount</TableHead>
                  <TableHead className="min-w-[100px]">Status</TableHead>
                  <TableHead className="min-w-[100px]">Chain</TableHead>
                  <TableHead className="min-w-[120px]">Date</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((tx) => (
                  <TableRow
                    key={tx.id}
                    className="cursor-pointer touch-manipulation"
                    onClick={() => setSelectedTx(tx)}
                  >
                    <TableCell>
                      <div>
                        <code className="text-xs font-mono text-muted-foreground break-all">
                          {tx.id}
                        </code>
                        {tx.recipient && (
                          <p className="text-sm mt-0.5 break-words">{tx.recipient}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="capitalize text-sm">{tx.type}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium whitespace-nowrap">
                        ${tx.amount.toLocaleString()} {tx.currency}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusChip status={tx.status} />
                    </TableCell>
                    <TableCell>
                      <span className="text-sm capitalize">{tx.chain}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(tx.createdAt), { addSuffix: true })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8 touch-manipulation">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Transaction Detail Drawer */}
      <Sheet open={!!selectedTx} onOpenChange={() => setSelectedTx(null)}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Transaction Details</SheetTitle>
          </SheetHeader>
          
          {selectedTx && (
            <div className="mt-6 space-y-6">
              <div className="flex items-center justify-between">
                <StatusChip status={selectedTx.status} />
                <span className="text-xs text-muted-foreground">
                  {format(new Date(selectedTx.createdAt), 'PPpp')}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground">Transaction ID</p>
                  <div className="flex items-center gap-1">
                    <code className="text-sm font-mono">{selectedTx.id}</code>
                    <CopyButton value={selectedTx.id} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Amount</p>
                    <p className="text-lg font-semibold">
                      ${selectedTx.amount.toLocaleString()} {selectedTx.currency}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Fee</p>
                    <p className="text-lg font-semibold">
                      ${selectedTx.fee?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="text-sm font-medium capitalize">{selectedTx.type}</p>
                </div>

                {selectedTx.recipient && (
                  <div>
                    <p className="text-xs text-muted-foreground">Recipient</p>
                    <p className="text-sm font-medium">{selectedTx.recipient}</p>
                    {selectedTx.recipientAddress && (
                      <div className="flex items-center gap-1 mt-1">
                        <code className="text-xs font-mono text-muted-foreground">
                          {selectedTx.recipientAddress}
                        </code>
                        <CopyButton value={selectedTx.recipientAddress} />
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <p className="text-xs text-muted-foreground">Chain</p>
                  <p className="text-sm font-medium capitalize">{selectedTx.chain}</p>
                </div>

                {selectedTx.txHash && (
                  <div>
                    <p className="text-xs text-muted-foreground">Transaction Hash</p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                        {selectedTx.txHash}
                      </code>
                      <CopyButton value={selectedTx.txHash} />
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}

                {selectedTx.blockNumber && (
                  <div>
                    <p className="text-xs text-muted-foreground">Block Number</p>
                    <p className="text-sm font-mono">{selectedTx.blockNumber}</p>
                  </div>
                )}

                {selectedTx.metadata?.receiptSummary && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">AI Receipt Summary</p>
                    <p className="text-sm bg-muted/50 rounded-lg p-3">{selectedTx.metadata.receiptSummary}</p>
                  </div>
                )}

                {selectedTx.metadata && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Metadata</p>
                    <JsonViewer data={selectedTx.metadata} />
                  </div>
                )}

                <div className="pt-4 border-t">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setReceiptDrawerOpen(true);
                    }}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    View AI Receipt
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <ReceiptDrawer
        open={receiptDrawerOpen}
        onOpenChange={setReceiptDrawerOpen}
        transactionId={selectedTx?.id}
        intentId={selectedTx?.intentId}
      />
    </div>
  );
}
