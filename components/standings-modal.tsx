"use client"

import { useMemo } from "react"
import type { Transaction } from "@/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"
import { TrendingUp, TrendingDown, DollarSign, Users } from "lucide-react"

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

    // Sort by highest spender first (shouldReceive amount)
    const sortedSettlements = settlements.sort((a, b) => b.shouldReceive - a.shouldReceive)

    const chartData = settlements.map((s) => ({
      name: s.name,
      spent: s.spent,
      fairShare: s.fairShare,
    }))

    return { settlements: sortedSettlements, chartData, totalExpense, fairShare }
  }, [transactions])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="mb-4">
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Monthly Standings
          </DialogTitle>
          <DialogDescription>
            View the current month's expense breakdown and settlements
          </DialogDescription>
        </DialogHeader>

        <div className="w-full space-y-6 p-4 sm:p-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Total Spent</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  ${standings.totalExpense.toFixed(2)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Fair Share</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  ${standings.fairShare.toFixed(2)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">Participants</span>
                </div>
                <p className="text-2xl font-bold text-purple-600">
                  {standings.settlements.length}
                </p>
              </CardContent>
            </Card>
          </div>

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
              <CardTitle>Monthly Settlements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {standings.settlements.map((settlement, index) => (
                  <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-lg font-semibold truncate">
                            {settlement.name}
                          </p>
                          {settlement.shouldReceive > 0 && (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          )}
                          {settlement.shouldPay > 0 && (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Spent:</span>
                            <span className="font-medium">${settlement.spent.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Fair Share:</span>
                            <span className="font-medium">${settlement.fairShare.toFixed(2)}</span>
                          </div>
                        </div>

                        <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              settlement.shouldReceive > 0 
                                ? 'bg-green-500' 
                                : settlement.shouldPay > 0 
                                ? 'bg-red-500' 
                                : 'bg-blue-500'
                            }`}
                            style={{
                              width: `${Math.min((settlement.spent / settlement.fairShare) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                      
                      <div className="text-right">
                        {settlement.shouldReceive > 0 ? (
                          <div className="text-green-600">
                            <p className="text-sm font-medium">Gets Back</p>
                            <p className="text-xl font-bold">+${settlement.shouldReceive.toFixed(2)}</p>
                          </div>
                        ) : settlement.shouldPay > 0 ? (
                          <div className="text-red-600">
                            <p className="text-sm font-medium">Owes</p>
                            <p className="text-xl font-bold">-${settlement.shouldPay.toFixed(2)}</p>
                          </div>
                        ) : (
                          <div className="text-blue-600">
                            <p className="text-sm font-medium">Balanced</p>
                            <p className="text-xl font-bold">$0.00</p>
                          </div>
                        )}
                      </div>
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
