"use client"

import { useState } from "react"
import type { Transaction } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Receipt, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ReceiptViewer } from "@/components/receipt-viewer"
import { useAuth } from "@/components/auth-provider"

interface TransactionFeedProps {
  transactions: Transaction[]
  loading: boolean
  onEdit: (transaction: Transaction) => void
  onDelete: (transactionId: string) => void
}

export function TransactionFeed({ transactions, loading, onEdit, onDelete }: TransactionFeedProps) {
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null)
  const { user } = useAuth()

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingSpinner />
        </CardContent>
      </Card>
    )
  }

  if (transactions.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">No transactions yet. Add your first expense!</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {transactions.map((transaction) => (
          <Card key={transaction.id} className="overflow-hidden">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">${transaction.amount.toFixed(2)}</p>
                    {transaction.type === "system" && (
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                        System
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{transaction.note}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(transaction.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {transaction.receiptUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedReceipt(transaction.receiptUrl!)}
                      className="w-full sm:w-auto"
                    >
                      View Receipt
                    </Button>
                  )}
                  {user?.isAdmin && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(transaction)}
                        className="w-full sm:w-auto"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(transaction.id)}
                        className="w-full sm:w-auto"
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {transactions.length === 0 && (
          <div className="text-center text-muted-foreground py-8">No transactions found</div>
        )}
        <ReceiptViewer
          imageUrl={selectedReceipt || ""}
          isOpen={!!selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      </CardContent>
    </Card>
  )
}
