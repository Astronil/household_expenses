"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { AddTransactionModal } from "@/components/add-transaction-modal"

type AddTransactionContextValue = {
  openAddTransaction: () => void
  setAddTransactionOpen: (open: boolean) => void
}

const AddTransactionContext = createContext<AddTransactionContextValue | null>(null)

export function AddTransactionProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <AddTransactionContext.Provider
      value={{
        openAddTransaction: () => setOpen(true),
        setAddTransactionOpen: setOpen,
      }}
    >
      {children}
      <AddTransactionModal open={open} onOpenChange={setOpen} />
    </AddTransactionContext.Provider>
  )
}

export function useAddTransaction() {
  const ctx = useContext(AddTransactionContext)
  if (!ctx) {
    throw new Error("useAddTransaction must be used within AddTransactionProvider")
  }
  return ctx
}
