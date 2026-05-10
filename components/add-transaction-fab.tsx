"use client"

import { usePathname } from "next/navigation"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAddTransaction } from "@/components/add-transaction-context"

export function AddTransactionFab() {
  const pathname = usePathname()
  const { openAddTransaction } = useAddTransaction()

  if (pathname !== "/" && pathname !== "/transactions") {
    return null
  }

  return (
    <Button
      type="button"
      onClick={openAddTransaction}
      size="icon"
      className="fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full shadow-xl bg-violet-600 hover:bg-violet-700 text-white border-2 border-violet-300/60 sm:bottom-8 sm:right-8"
      aria-label="Add expense"
    >
      <Plus className="h-7 w-7" strokeWidth={2.5} />
    </Button>
  )
}
