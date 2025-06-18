"use client"

import { useMemo } from "react"
import { useAuth } from "@/components/auth-provider"
import type { Transaction } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, Calendar, Calculator } from "lucide-react"

interface StatsCardsProps {
  transactions: Transaction[]
}

export function StatsCards({ transactions }: StatsCardsProps) {
  const { user } = useAuth()

  const stats = useMemo(() => {
    const now = new Date()
    const currentMonth = now.toISOString().slice(0, 7) // YYYY-MM
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const thisWeekTotal = transactions
      .filter((t) => new Date(t.timestamp) >= weekAgo)
      .reduce((sum, t) => sum + t.amount, 0)

    const thisMonthUserTotal = transactions
      .filter((t) => t.month === currentMonth && t.userId === user?.id)
      .reduce((sum, t) => sum + t.amount, 0)

    const thisMonthHouseholdTotal = transactions
      .filter((t) => t.month === currentMonth)
      .reduce((sum, t) => sum + t.amount, 0)

    return {
      thisWeekTotal,
      thisMonthUserTotal,
      thisMonthHouseholdTotal,
    }
  }, [transactions, user?.id])

  const totalExpense = stats.thisMonthHouseholdTotal
  const fairShare = stats.thisMonthUserTotal
  const userSpent = stats.thisMonthUserTotal
  const monthlyAverage = stats.thisMonthHouseholdTotal / (new Date().getMonth() + 1)
  const monthsWithTransactions = new Date().getMonth() + 1

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${totalExpense.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            {transactions.length} transactions this month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Your Share</CardTitle>
          <Calculator className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${fairShare.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            {userSpent > fairShare ? "You owe" : "You're owed"} ${Math.abs(userSpent - fairShare).toFixed(2)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monthly Average</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${monthlyAverage.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            Based on {monthsWithTransactions} months
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
