"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ReceiptViewer } from "@/components/receipt-viewer"

interface Transaction {
  id: string
  amount: number
  note: string | null
  receiptUrl: string | null
  timestamp: string
}

interface TransactionListProps {
  transactions: Transaction[]
}

export function TransactionList({ transactions }: TransactionListProps) {
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      {transactions.map((transaction) => (
        <div
          key={transaction.id}
          className="flex items-center justify-between rounded-xl border border-border/50 bg-card/80 p-4 shadow-sm backdrop-blur-sm transition-shadow duration-200 hover:shadow-md supports-[backdrop-filter]:bg-card/65"
        >
          <div className="flex items-center space-x-4">
            <div>
              <p className="font-medium">${transaction.amount.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">{transaction.note || "No note"}</p>
            </div>
            {transaction.receiptUrl && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedReceipt(transaction.receiptUrl)}
                className="text-primary hover:text-primary/90"
              >
                View Receipt
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {new Date(transaction.timestamp).toLocaleDateString()}
          </p>
        </div>
      ))}

      <ReceiptViewer
        imageUrl={selectedReceipt || ""}
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
      />
    </div>
  )
} 