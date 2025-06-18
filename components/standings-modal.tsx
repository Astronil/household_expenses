"use client"

import { useMemo } from "react"
import type { Transaction } from "@/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"

interface StandingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transactions: Transaction[]
}

export function StandingsModal({ open, onOpenChange, transactions }: StandingsModalProps) {
  const standings = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7)
    const monthlyTransactions = transactions.filter((t) => t.month === currentMonth)

    const userTotals = monthlyTransactions.reduce(
      (acc, transaction) => {
        acc[transaction.userName] = (acc[transaction.userName] || 0) + transaction.amount
        return acc
      },
      {} as Record<string, number>,
    )

    const totalExpense = Object.values(userTotals).reduce((sum, amount) => sum + amount, 0)
    const userCount = Object.keys(userTotals).length
    const fairShare = userCount > 0 ? totalExpense / userCount : 0

    const settlements = Object.entries(userTotals).map(([name, spent]) => ({
      name,
      spent,
      fairShare,
      difference: spent - fairShare,
      shouldPay: spent < fairShare ? fairShare - spent : 0,
      shouldReceive: spent > fairShare ? spent - fairShare : 0,
    }))

    const chartData = settlements.map((s) => ({
      name: s.name,
      spent: s.spent,
      fairShare: s.fairShare,
    }))

    return { settlements, chartData, totalExpense, fairShare }
  }, [transactions])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="mb-4">
          <DialogTitle>Monthly Standings</DialogTitle>
          <DialogDescription>
            View the current month's expense breakdown and settlements
          </DialogDescription>
        </DialogHeader>

        <div className="w-full space-y-6 p-4 sm:p-6">
          <Card>
            <CardHeader>
              <CardTitle>Expense Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={standings.chartData}>
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="spent" fill="#8884d8" />
                    <Bar dataKey="fairShare" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detailed Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {standings.settlements.map((settlement, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {settlement.name}
                        </p>
                        <div className="w-full bg-gray-100 rounded-full h-2 mt-1">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{
                              width: `${(settlement.spent / settlement.fairShare) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                      <p className="text-sm font-medium whitespace-nowrap">
                        ${settlement.spent.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-4 sm:p-6 border-t">
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
