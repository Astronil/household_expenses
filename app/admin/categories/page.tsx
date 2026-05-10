"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { HouseholdGate } from "@/components/household-gate"
import { Header } from "@/components/header"
import { AdminCategoriesManager } from "@/components/admin-categories-manager"
import { useAuth } from "@/components/auth-provider"
import { LoadingSpinner } from "@/components/loading-spinner"

export default function AdminCategoriesPage() {
  return (
    <HouseholdGate>
      <AdminCategoriesPageInner />
    </HouseholdGate>
  )
}

function AdminCategoriesPageInner() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!user?.householdId) {
      router.replace("/")
      return
    }
    if (!user.isAdmin) {
      router.replace("/")
    }
  }, [loading, user, router])

  if (loading || !user?.householdId) {
    return <LoadingSpinner />
  }

  if (!user.isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header>
        <h1 className="text-lg sm:text-xl font-bold">Expense categories</h1>
      </Header>
      <AdminCategoriesManager />
    </div>
  )
}
