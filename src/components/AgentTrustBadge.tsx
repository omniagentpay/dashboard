import { Badge } from '@/components/ui/badge';
import { Shield, ShieldCheck, ShieldAlert, ShieldOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Agent, AgentRiskTier, TrustLevel } from '@/types';

interface AgentTrustBadgeProps {
  agent: Agent;
  showScore?: boolean;
  className?: string;
}

const trustIcons = {
  trusted: ShieldCheck,
  verified: Shield,
  new: Shield,
  flagged: ShieldAlert,
};

const trustColors = {
  trusted: 'bg-green-50 text-green-700 border-green-200',
  verified: 'bg-blue-50 text-blue-700 border-blue-200',
  new: 'bg-gray-50 text-gray-700 border-gray-200',
  flagged: 'bg-red-50 text-red-700 border-red-200',
};

const riskTierLabels = {
  low: 'Low Risk',
  medium: 'Medium Risk',
  high: 'High Risk',
  critical: 'Critical Risk',
};

export function AgentTrustBadge({ agent, showScore = false, className }: AgentTrustBadgeProps) {
  const Icon = trustIcons[agent.trustLevel] || Shield;
  const trustColor = trustColors[agent.trustLevel] || trustColors.new;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Badge variant="outline" className={cn('flex items-center gap-1.5', trustColor)}>
        <Icon className="h-3 w-3" />
        <span className="text-xs font-medium capitalize">{agent.trustLevel}</span>
      </Badge>
      {showScore && (
        <span className="text-xs text-muted-foreground">
          Score: {agent.spendReputationScore}/100
        </span>
      )}
      <Badge variant="outline" className="text-xs">
        {riskTierLabels[agent.riskTier]}
      </Badge>
    </div>
  );
}
