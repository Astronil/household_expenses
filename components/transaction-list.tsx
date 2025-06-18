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
        <div key={transaction.id} className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
          <div className="flex items-center space-x-4">
            <div>
              <p className="font-medium">${transaction.amount.toFixed(2)}</p>
              <p className="text-sm text-gray-500">{transaction.note || "No note"}</p>
            </div>
            {transaction.receiptUrl && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedReceipt(transaction.receiptUrl)}
                className="text-blue-600 hover:text-blue-700"
              >
                View Receipt
              </Button>
            )}
          </div>
          <p className="text-sm text-gray-500">
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