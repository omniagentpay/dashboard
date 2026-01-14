import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface SuccessRateDonutProps {
  successRate: number; // 0-100
  totalExecutions: number;
  className?: string;
}

export function SuccessRateDonut({ successRate, totalExecutions, className }: SuccessRateDonutProps) {
  const hasData = totalExecutions > 0;

  // Don't show the donut chart if there's no data - return empty decorative element
  if (!hasData) {
    return (
      <div className={`relative ${className}`}>
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-2 border-muted/30" />
        </div>
      </div>
    );
  }

  const data = [
    { name: 'success', value: successRate },
    { name: 'other', value: Math.max(0, 100 - successRate) },
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
              <Cell 
                key={`cell-${index}`} 
                fill={entry.name === 'success' ? 'hsl(var(--success))' : 'hsl(var(--muted))'} 
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
