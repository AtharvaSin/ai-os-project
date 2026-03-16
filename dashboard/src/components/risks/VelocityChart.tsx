'use client';

import { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import type { VelocityDataPoint } from '@/lib/types';

interface VelocityChartProps {
  data: VelocityDataPoint[];
}

const PROJECT_COLORS = ['#7B68EE', '#4ECDC4', '#E8B931', '#FF6B6B', '#a09d95'];

export function VelocityChart({ data }: VelocityChartProps) {
  // Pivot data: each date becomes a row with project columns
  const { chartData, projects } = useMemo(() => {
    const projectSet = new Set<string>();
    const dateMap: Record<string, Record<string, number>> = {};

    for (const d of data) {
      projectSet.add(d.project_name);
      if (!dateMap[d.date]) dateMap[d.date] = {};
      const row = dateMap[d.date];
      if (row) row[d.project_name] = d.completed_count;
    }

    const projects = Array.from(projectSet);
    const chartData = Object.entries(dateMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => ({
        date: new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        ...vals,
      }));

    return { chartData, projects };
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div className="card p-6 text-center text-text-muted text-sm">
        No velocity data available
      </div>
    );
  }

  return (
    <div className="card p-4">
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f1f35" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#807d75' }}
            axisLine={{ stroke: '#1f1f35' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#807d75' }}
            axisLine={{ stroke: '#1f1f35' }}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#12121e',
              border: '1px solid #1f1f35',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#e8e6e1',
            }}
          />
          {projects.map((proj, i) => (
            <Line
              key={proj}
              type="monotone"
              dataKey={proj}
              stroke={PROJECT_COLORS[i % PROJECT_COLORS.length]}
              strokeWidth={2}
              dot={false}
              name={proj}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-3 mt-3 px-2">
        {projects.map((proj, i) => (
          <div key={proj} className="flex items-center gap-1.5 text-xs text-text-secondary">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: PROJECT_COLORS[i % PROJECT_COLORS.length] }}
            />
            {proj}
          </div>
        ))}
      </div>
    </div>
  );
}
