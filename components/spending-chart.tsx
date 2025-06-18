"use client"

import { useMemo } from "react"
import type { Transaction } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"

interface SpendingChartProps {
  transactions: Transaction[]
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"]

export function SpendingChart({ transactions }: SpendingChartProps) {
  const chartData = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7)
    const monthlyTransactions = transactions.filter((t) => t.month === currentMonth)

    const userTotals = monthlyTransactions.reduce(
      (acc, transaction) => {
        acc[transaction.userName] = (acc[transaction.userName] || 0) + transaction.amount
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.entries(userTotals).map(([name, amount]) => ({
      name,
      value: amount,
    }))
  }, [transactions])

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly Spending Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No expenses recorded this month
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Spending Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            value: {
              label: "Amount",
              color: "hsl(var(--chart-1))",
            },
          }}
          className="h-64"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: $${value.toFixed(2)}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
