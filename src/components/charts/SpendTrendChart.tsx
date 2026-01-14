import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';

interface SpendTrendChartProps {
  data: Array<{ time: string; value: number }>;
  className?: string;
}

export function SpendTrendChart({ data, className }: SpendTrendChartProps) {
  // Check if all values are zero or no meaningful data
  const hasData = data && data.length > 0 && data.some(d => d.value > 0);
  const allZero = data && data.length > 0 && data.every(d => d.value === 0);

  // If no data or all zeros, show empty state with message
  if (!hasData) {
    return (
      <div className={`h-12 flex flex-col items-center justify-center ${className}`}>
        <div className="h-0.5 w-full bg-muted/30 rounded-full mb-1" />
        <span className="text-xs text-muted-foreground">No agent spend detected today</span>
      </div>
    );
  }

  // Ensure smooth variation even with sparse data
  const normalizedData = data.map((d, i) => ({
    ...d,
    value: d.value || 0,
  }));

  return (
    <div className={`h-12 ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={normalizedData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-card border border-border rounded-md px-2 py-1 text-xs shadow-sm">
                    <p className="text-muted-foreground">{payload[0].payload.time}</p>
                    <p className="font-medium">${payload[0].value?.toLocaleString()}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="hsl(var(--primary))"
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3, fill: 'hsl(var(--primary))' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
