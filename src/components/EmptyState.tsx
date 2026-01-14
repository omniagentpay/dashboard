import { cn } from '@/lib/utils';
import { LucideIcon, FileQuestion, Inbox, Search, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'default' | 'search' | 'error';
  className?: string;
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action, 
  variant = 'default',
  className 
}: EmptyStateProps) {
  const DefaultIcon = variant === 'search' ? Search : variant === 'error' ? AlertCircle : Inbox;
  const DisplayIcon = Icon || DefaultIcon;

  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-12 px-4 text-center',
      className
    )}>
      <div className={cn(
        "p-3 rounded-full mb-4",
        variant === 'error' ? "bg-destructive/10" : "bg-muted"
      )}>
        <DisplayIcon className={cn(
          "h-8 w-8",
          variant === 'error' ? "text-destructive" : "text-muted-foreground"
        )} />
      </div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-4">
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick} variant="outline">
          {action.label}
        </Button>
      )}
    </div>
  );
}
