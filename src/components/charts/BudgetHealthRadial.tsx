import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface BudgetHealthRadialProps {
  used: number;
  remaining: number;
  threshold: number; // Auto-approval threshold
  total: number;
  className?: string;
}

export function BudgetHealthRadial({ used, remaining, threshold, total, className }: BudgetHealthRadialProps) {
  const usedPercent = (used / total) * 100;
  const thresholdPercent = (threshold / total) * 100;
  
  // Determine color based on usage vs threshold
  let fillColor = 'hsl(var(--success))'; // Safe (green)
  if (usedPercent >= thresholdPercent) {
    fillColor = 'hsl(var(--destructive))'; // Over threshold (red)
  } else if (usedPercent >= thresholdPercent * 0.8) {
    fillColor = 'hsl(var(--warning))'; // Approaching threshold (yellow)
  }

  // Create data: used portion and remaining portion
  const data = [
    {
      name: 'used',
      value: usedPercent,
      fill: fillColor,
    },
    {
      name: 'remaining',
      value: Math.max(0, 100 - usedPercent),
      fill: 'hsl(var(--muted))',
    },
  ];

  // Chart is decorative only - no text content here
  return (
    <div className={`relative ${className}`}>
      <ResponsiveContainer width="100%" height={100}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={32}
            outerRadius={40}
            startAngle={90}
            endAngle={-270}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
