import { CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AgentStatusBannerProps {
  agentsRequiringAttention: number;
  className?: string;
}

export function AgentStatusBanner({ agentsRequiringAttention, className }: AgentStatusBannerProps) {
  const isHealthy = agentsRequiringAttention === 0;

  return (
    <div
      className={cn(
        'rounded-lg border px-4 py-3 mb-6',
        isHealthy
          ? 'bg-success/5 border-success/20'
          : 'bg-warning/5 border-warning/20',
        className
      )}
    >
      <div className="flex items-center gap-3">
        {isHealthy ? (
          <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
        ) : (
          <AlertCircle className="h-5 w-5 text-warning shrink-0" />
        )}
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">
            {isHealthy
              ? 'All agents operating within guardrails'
              : `${agentsRequiringAttention} agent${agentsRequiringAttention > 1 ? 's' : ''} require${agentsRequiringAttention === 1 ? 's' : ''} attention`}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isHealthy
              ? 'Payment operations are running smoothly with all guard policies active'
              : 'Review pending approvals or flagged agents to maintain operational safety'}
          </p>
        </div>
      </div>
    </div>
  );
}
