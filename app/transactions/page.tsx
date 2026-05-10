"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { HouseholdGate } from "@/components/household-gate"
import { TransactionsView } from "@/components/transactions-view"
import { useAuth } from "@/components/auth-provider"
import { LoadingSpinner } from "@/components/loading-spinner"

export default function TransactionsPage() {
  return (
    <HouseholdGate>
      <TransactionsPageInner />
    </HouseholdGate>
  )
}

function TransactionsPageInner() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user?.householdId) {
      router.replace("/")
    }
  }, [loading, user?.householdId, router])

  if (loading || !user?.householdId) {
    return <LoadingSpinner />
  }

  return <TransactionsView />
}
