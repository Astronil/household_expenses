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
      className="fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full border border-white/25 bg-gradient-to-br from-primary via-chart-2 to-chart-3 text-primary-foreground shadow-[0_12px_40px_-8px_hsl(var(--primary)/0.55),0_4px_16px_-4px_hsl(var(--foreground)/0.2)] transition-all duration-300 hover:scale-[1.04] hover:shadow-[0_16px_48px_-8px_hsl(var(--primary)/0.6)] active:scale-95 sm:bottom-8 sm:right-8"
      aria-label="Add expense"
    >
      <Plus className="h-7 w-7" strokeWidth={2.5} />
    </Button>
  )
}
