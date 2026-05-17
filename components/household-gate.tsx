"use client"

import type { ReactNode } from "react"
import { useAuth } from "@/components/auth-provider"
import { AuthScreen } from "@/components/auth-screen"
import { HouseholdSetup } from "@/components/household-setup"
import { LoadingSpinner } from "@/components/loading-spinner"
import { AddTransactionProvider } from "@/components/add-transaction-context"
import { AddTransactionFab } from "@/components/add-transaction-fab"

export function HouseholdGate({ children }: { children: ReactNode }) {
  const { user, firebaseUser, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  if (!firebaseUser) {
    return <AuthScreen />
  }

  if (!user) {
    return <LoadingSpinner />
  }

  if (!user.householdId) {
    return <HouseholdSetup />
  }

  return (
    <AddTransactionProvider>
      {children}
      <AddTransactionFab />
    </AddTransactionProvider>
  )
}
