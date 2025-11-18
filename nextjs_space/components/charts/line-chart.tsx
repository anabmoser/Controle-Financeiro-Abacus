
'use client'

import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface LineChartProps {
  data: Array<{ month: string; value: number }>
}

export default function LineChart({ data }: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsLineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 10 }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10 }}
          tickLine={false}
          tickFormatter={(value) => `R$ ${value}`}
        />
        <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#3B82F6"
          strokeWidth={2}
          dot={{ fill: '#3B82F6' }}
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  )
}
