"use client"

import { useState } from "react"
import Link from "next/link"
import type { Transaction } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ReceiptViewer } from "@/components/receipt-viewer"
import { useAuth } from "@/components/auth-provider"

interface TransactionFeedProps {
  transactions: Transaction[]
  loading: boolean
  onEdit: (transaction: Transaction) => void
  onDelete: (transactionId: string) => void
  /** If set, only show the first N items (e.g. dashboard preview). */
  maxItems?: number
  title?: string
  viewAllHref?: string
  viewAllLabel?: string
  showMember?: boolean
}

export function TransactionFeed({
  transactions,
  loading,
  onEdit,
  onDelete,
  maxItems,
  title = "Recent Transactions",
  viewAllHref,
  viewAllLabel = "View all transactions",
  showMember,
}: TransactionFeedProps) {
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null)
  const { user } = useAuth()

  const visible =
    maxItems !== undefined ? transactions.slice(0, maxItems) : transactions

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
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
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">No transactions yet. Add your first expense!</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <CardTitle>{title}</CardTitle>
        {viewAllHref && maxItems !== undefined && transactions.length > maxItems && (
          <Button variant="link" asChild className="h-auto p-0 text-primary">
            <Link href={viewAllHref}>{viewAllLabel}</Link>
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {visible.map((transaction) => (
          <Card key={transaction.id} className="overflow-hidden">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">${transaction.amount.toFixed(2)}</p>
                    {transaction.type === "system" && (
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                        System
                      </span>
                    )}
                    {(transaction.categoryName || transaction.subcategoryName) && (
                      <div className="flex flex-wrap gap-1">
                        {transaction.categoryName && (
                          <Badge variant="secondary" className="text-xs font-normal">
                            {transaction.categoryName}
                          </Badge>
                        )}
                        {transaction.subcategoryName && (
                          <Badge variant="outline" className="text-xs font-normal">
                            {transaction.subcategoryName}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  {showMember && transaction.userName && transaction.type !== "system" && (
                    <p className="text-xs text-muted-foreground">By {transaction.userName}</p>
                  )}
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
        {visible.length === 0 && (
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
