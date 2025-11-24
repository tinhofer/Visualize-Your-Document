import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { ChartDataPoint } from '../types';

interface ChartProps {
  data: ChartDataPoint[];
  type: 'bar' | 'line';
  xAxisLabel: string;
  yAxisLabel: string;
  color?: string;
}

export const SimpleChart: React.FC<ChartProps> = ({ data, type, xAxisLabel, yAxisLabel, color = "#6366f1" }) => {
  const CommonComponents = () => (
    <>
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
      <XAxis 
        dataKey="name" 
        stroke="#64748b" 
        fontSize={12} 
        tickLine={false}
        axisLine={false}
      />
      <YAxis 
        stroke="#64748b" 
        fontSize={12} 
        tickLine={false} 
        axisLine={false}
      />
      <Tooltip 
        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
        itemStyle={{ color: '#1e293b' }}
      />
      <Legend />
    </>
  );

  if (type === 'line') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CommonComponents />
          <Line 
            type="monotone" 
            dataKey="value" 
            name={yAxisLabel} 
            stroke={color} 
            strokeWidth={3}
            dot={{ r: 4, strokeWidth: 2 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CommonComponents />
        <Bar 
          dataKey="value" 
          name={yAxisLabel} 
          fill={color} 
          radius={[4, 4, 0, 0]} 
        />
      </BarChart>
    </ResponsiveContainer>
  );
};