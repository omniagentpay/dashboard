import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface ActivitySparklineProps {
  data: Array<{ time: string; count: number }>;
  className?: string;
}

export function ActivitySparkline({ data, className }: ActivitySparklineProps) {
  // If no data, show minimal placeholder
  if (!data || data.length === 0) {
    return (
      <div className={`h-8 flex items-center ${className}`}>
        <div className="h-0.5 w-full bg-muted/30 rounded-full" />
      </div>
    );
  }

  // Ensure we have some variation for visual interest
  const hasActivity = data.some(d => d.count > 0);

  return (
    <div className={`h-8 ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <Line
            type="monotone"
            dataKey="count"
            stroke="hsl(var(--primary))"
            strokeWidth={1.5}
            dot={false}
            activeDot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
