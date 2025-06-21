"use client"

import { useMemo, useEffect, useState } from "react"
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/components/auth-provider"
import type { Transaction } from "@/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"
import { TrendingUp, TrendingDown, DollarSign, Users, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface StandingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transactions: Transaction[]
}

interface HouseholdMember {
  id: string
  name: string
  email: string
}

export function StandingsModal({ open, onOpenChange, transactions }: StandingsModalProps) {
  const { user } = useAuth()
  const [householdMembers, setHouseholdMembers] = useState<HouseholdMember[]>([])
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))

  const lastSixMonths = useMemo(() => {
    const months = [];
    const today = new Date();
    for (let i = 0; i < 6; i++) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        months.push({
            value: d.toISOString().slice(0, 7),
            label: d.toLocaleString('default', { month: 'long', year: 'numeric' })
        });
    }
    return months;
  }, []);

  // Fetch household members
  useEffect(() => {
    const fetchHouseholdMembers = async () => {
      if (!user?.householdId) return

      try {
        const householdRef = doc(db, "households", user.householdId)
        const householdDoc = await getDoc(householdRef)
        
        if (householdDoc.exists()) {
          const householdData = householdDoc.data()
          const memberIds = householdData.members || []
          
          const memberDetails = await Promise.all(
            memberIds.map(async (memberId: string) => {
              const userDoc = await getDoc(doc(db, "users", memberId))
              const userData = userDoc.data()
              return {
                id: memberId,
                name: userData?.name || "Unknown User",
                email: userData?.email || "",
              }
            })
          )
          setHouseholdMembers(memberDetails)
        }
      } catch (error) {
        console.error("Error fetching household members:", error)
      }
    }

    if (open) {
      fetchHouseholdMembers()
      // Reset to current month when modal is opened
      setSelectedMonth(new Date().toISOString().slice(0, 7))
    }
  }, [user?.householdId, open])

  const standings = useMemo(() => {
    const monthlyTransactions = transactions.filter((t) => t.month === selectedMonth)

    // Create a map of all household members with their spending
    const userTotals: Record<string, number> = {}
    
    // Initialize all household members with $0
    householdMembers.forEach(member => {
      userTotals[member.name] = 0
    })
    
    // Add actual transaction amounts
    monthlyTransactions.forEach(transaction => {
      if (userTotals.hasOwnProperty(transaction.userName)) {
        userTotals[transaction.userName] += transaction.amount
      } else {
        // Handle case where transaction user is not in household members
        userTotals[transaction.userName] = (userTotals[transaction.userName] || 0) + transaction.amount
      }
    })

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
  }, [transactions, householdMembers, selectedMonth])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="mb-4">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <TrendingUp className="h-5 w-5" />
            Monthly Standings
          </DialogTitle>
          <DialogDescription className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <span className="text-sm">View expense breakdown and settlements by month.</span>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {lastSixMonths.map(month => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Total Spent</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-green-600">
                  ${standings.totalExpense.toFixed(2)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Fair Share</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-blue-600">
                  ${standings.fairShare.toFixed(2)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">Participants</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-purple-600">
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
                      tick={{ fontSize: 10 }}
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 10 }} />
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
              <div className="space-y-3 sm:space-y-4">
                {standings.settlements.map((settlement, index) => (
                  <div key={index} className="border rounded-lg p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col gap-3 sm:gap-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <p className="text-base sm:text-lg font-semibold truncate">
                            {settlement.name}
                          </p>
                          {settlement.shouldReceive > 0 && (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          )}
                          {settlement.shouldPay > 0 && (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        
                        <div className="text-right">
                          {settlement.shouldReceive > 0 ? (
                            <div className="text-green-600">
                              <p className="text-xs sm:text-sm font-medium">Gets Back</p>
                              <p className="text-lg sm:text-xl font-bold">+${settlement.shouldReceive.toFixed(2)}</p>
                            </div>
                          ) : settlement.shouldPay > 0 ? (
                            <div className="text-red-600">
                              <p className="text-xs sm:text-sm font-medium">Owes</p>
                              <p className="text-lg sm:text-xl font-bold">-${settlement.shouldPay.toFixed(2)}</p>
                            </div>
                          ) : (
                            <div className="text-blue-600">
                              <p className="text-xs sm:text-sm font-medium">Balanced</p>
                              <p className="text-lg sm:text-xl font-bold">$0.00</p>
                            </div>
                          )}
                        </div>
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

                      <div className="w-full bg-gray-200 rounded-full h-2">
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
