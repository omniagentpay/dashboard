# Component Documentation

Reference guide for all OmniAgentPay components.

## Core Components

### PaymentTimeline

Chronological timeline of payment decision events.

**Location**: `src/components/PaymentTimeline.tsx`

**Props:**
```typescript
interface PaymentTimelineProps {
  intentId: string;
  className?: string;
}
```

**Usage:**
```tsx
<PaymentTimeline intentId="pi_123" />
```

**Features:**
- Displays events chronologically
- Color-coded status indicators
- Shows tool inputs/outputs
- Displays guard results
- Transaction hashes

### ExplainPaymentDrawer

Side drawer with deterministic payment explanations.

**Location**: `src/components/ExplainPaymentDrawer.tsx`

**Props:**
```typescript
interface ExplainPaymentDrawerProps {
  intentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
```

**Usage:**
```tsx
<ExplainPaymentDrawer
  intentId="pi_123"
  open={isOpen}
  onOpenChange={setIsOpen}
/>
```

**Features:**
- Who initiated (agent + tool)
- Why it happened
- Decision rationale
- Route details
- Blocking conditions

### WhatIfSimulator

Interactive payment scenario simulator.

**Location**: `src/components/WhatIfSimulator.tsx`

**Props:**
```typescript
interface WhatIfSimulatorProps {
  className?: string;
}
```

**Usage:**
```tsx
<WhatIfSimulator />
```

**Features:**
- Adjustable amount
- Guard preset selection
- Chain selection
- Time-based simulation
- Live guard evaluation

### ApprovalModal

Enterprise-grade payment approval interface.

**Location**: `src/components/ApprovalModal.tsx`

**Props:**
```typescript
interface ApprovalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: ApprovalRequest | null;
  onApprove: (action: ApprovalAction) => Promise<void>;
}
```

**Usage:**
```tsx
<ApprovalModal
  open={isOpen}
  onOpenChange={setIsOpen}
  request={approvalRequest}
  onApprove={handleApprove}
/>
```

**Actions:**
- Approve once
- Approve similar (24h)
- Deny & update guard

### IncidentReplay

Re-run transactions with current guard rules.

**Location**: `src/components/IncidentReplay.tsx`

**Props:**
```typescript
interface IncidentReplayProps {
  intentId: string;
  className?: string;
}
```

**Usage:**
```tsx
<IncidentReplay intentId="pi_123" />
```

**Features:**
- Original vs. current results
- Guard comparison
- Change detection
- Side-by-side view

### BlastRadiusPreview

Impact analysis for guard changes.

**Location**: `src/components/BlastRadiusPreview.tsx`

**Props:**
```typescript
interface BlastRadiusPreviewProps {
  guardId?: string;
  className?: string;
}
```

**Usage:**
```tsx
<BlastRadiusPreview guardId="guard_1" />
```

**Features:**
- Affected agents
- Affected tools
- Daily exposure
- Progress visualization

### AgentTrustBadge

Visual indicator of agent trustworthiness.

**Location**: `src/components/AgentTrustBadge.tsx`

**Props:**
```typescript
interface AgentTrustBadgeProps {
  agent: Agent;
  showScore?: boolean;
  className?: string;
}
```

**Usage:**
```tsx
<AgentTrustBadge agent={agent} showScore />
```

**Features:**
- Trust level badge
- Risk tier indicator
- Reputation score (optional)
- Color-coded status

### McpSdkContractExplorer

View API/MCP/SDK integration details.

**Location**: `src/components/McpSdkContractExplorer.tsx`

**Props:**
```typescript
interface McpSdkContractExplorerProps {
  intentId: string;
  className?: string;
}
```

**Usage:**
```tsx
<McpSdkContractExplorer intentId="pi_123" />
```

**Tabs:**
- Backend API Call
- MCP Tool Invocation
- SDK Method Call

### AuditorModeToggle

Toggle for read-only auditor mode.

**Location**: `src/components/AuditorModeToggle.tsx`

**Props:**
```typescript
interface AuditorModeToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  className?: string;
}
```

**Usage:**
```tsx
<AuditorModeToggle
  enabled={auditorMode}
  onToggle={setAuditorMode}
/>
```

## UI Components (shadcn/ui)

All UI components are from shadcn/ui. See [shadcn/ui documentation](https://ui.shadcn.com) for details.

### Commonly Used

- **Button**: `src/components/ui/button.tsx`
- **Card**: `src/components/ui/card.tsx`
- **Dialog**: `src/components/ui/dialog.tsx`
- **Drawer/Sheet**: `src/components/ui/sheet.tsx`
- **Input**: `src/components/ui/input.tsx`
- **Select**: `src/components/ui/select.tsx`
- **Tabs**: `src/components/ui/tabs.tsx`
- **Badge**: `src/components/ui/badge.tsx`
- **Switch**: `src/components/ui/switch.tsx`

## Utility Components

### MetricCard

Enhanced metric card with circular progress.

**Location**: `src/components/MetricCard.tsx`

**Props:**
```typescript
interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: LucideIcon;
  trend?: { value: number; isPositive: boolean };
  progress?: number; // 0-100
  className?: string;
}
```

**Usage:**
```tsx
<MetricCard
  label="Spend Today"
  value="$1,500"
  progress={50}
  icon={DollarSign}
/>
```

### StatusChip

Status indicator chip.

**Location**: `src/components/StatusChip.tsx`

**Props:**
```typescript
interface StatusChipProps {
  status: PaymentStatus | TransactionStatus;
}
```

### LoadingSkeleton

Loading state skeleton.

**Location**: `src/components/LoadingSkeleton.tsx`

**Props:**
```typescript
interface LoadingSkeletonProps {
  variant: 'card' | 'table' | 'metric';
  count?: number;
  className?: string;
}
```

### EmptyState

Empty state component.

**Location**: `src/components/EmptyState.tsx`

**Props:**
```typescript
interface EmptyStateProps {
  title: string;
  description: string;
  variant?: 'default' | 'error' | 'search';
  action?: { label: string; onClick: () => void };
}
```

### CodeSnippet

Syntax-highlighted code display.

**Location**: `src/components/CodeSnippet.tsx`

**Props:**
```typescript
interface CodeSnippetProps {
  code: string;
  language: string;
}
```

### CopyButton

One-click copy to clipboard.

**Location**: `src/components/CopyButton.tsx`

**Props:**
```typescript
interface CopyButtonProps {
  value: string;
}
```

## Page Components

### DashboardPage

Main dashboard with metrics and activity.

**Location**: `src/pages/app/DashboardPage.tsx`

**Features:**
- Metric cards with progress rings
- Pending approvals
- Recent activity
- Success rate tracking

### PaymentIntentsPage

List of all payment intents.

**Location**: `src/pages/app/PaymentIntentsPage.tsx`

**Features:**
- Search and filter
- Status filtering
- Create new intent
- Link to detail page

### IntentDetailPage

Detailed payment intent view.

**Location**: `src/pages/app/IntentDetailPage.tsx`

**Features:**
- Payment timeline
- Explain drawer
- Approval modal
- Incident replay
- Contract explorer
- Agent trust badge

### GuardStudioPage

Guard configuration interface.

**Location**: `src/pages/app/GuardStudioPage.tsx`

**Features:**
- Guard preset studio
- Individual guard configuration
- What-if simulator
- Blast radius preview

## Component Patterns

### Loading States

All components handle loading states:

```tsx
const [loading, setLoading] = useState(true);

if (loading) {
  return <LoadingSkeleton variant="card" />;
}
```

### Error Handling

Components handle errors gracefully:

```tsx
try {
  const data = await service.getData();
  setData(data);
} catch (error) {
  console.error('Failed to load:', error);
  setError(error.message);
}
```

### Empty States

Components show empty states:

```tsx
{items.length === 0 ? (
  <EmptyState
    title="No items found"
    description="Create your first item to get started"
    action={{ label: 'Create Item', onClick: handleCreate }}
  />
) : (
  <ItemList items={items} />
)}
```

## Styling

### Tailwind CSS

All components use Tailwind CSS for styling:

```tsx
<div className="flex items-center gap-2 p-4 rounded-lg border">
```

### Design Tokens

- **Colors**: Use semantic color tokens (`text-muted-foreground`, `bg-success`, etc.)
- **Spacing**: Use consistent spacing scale (gap-2, gap-4, p-4, etc.)
- **Typography**: Use text size scale (text-xs, text-sm, text-base, etc.)

### Responsive Design

Components are responsive:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
```

## Accessibility

### Keyboard Navigation

All interactive components support keyboard navigation:

```tsx
<Button
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
>
```

### ARIA Labels

Components include ARIA labels:

```tsx
<Button aria-label="Approve payment intent">
  Approve
</Button>
```

### Focus Management

Modals and drawers manage focus:

```tsx
<Dialog>
  <DialogContent>
    {/* Focus automatically moves here */}
  </DialogContent>
</Dialog>
```

## Best Practices

1. **Type Safety**: Always use TypeScript types
2. **Error Handling**: Handle errors gracefully
3. **Loading States**: Show loading indicators
4. **Empty States**: Provide helpful empty states
5. **Accessibility**: Include ARIA labels
6. **Responsive**: Design for all screen sizes
7. **Performance**: Use React.memo for expensive components
