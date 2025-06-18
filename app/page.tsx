"use client"

import { useAuth } from "@/components/auth-provider"
import { AuthScreen } from "@/components/auth-screen"
import { HouseholdSetup } from "@/components/household-setup"
import { Dashboard } from "@/components/dashboard"
import { LoadingSpinner } from "@/components/loading-spinner"

export default function Home() {
  const { user, firebaseUser, loading } = useAuth()

  console.log("Home page render:", { loading, hasFirebaseUser: !!firebaseUser, hasUser: !!user })

  if (loading) {
    console.log("Loading state, showing spinner")
    return <LoadingSpinner />
  }

  if (!firebaseUser) {
    console.log("No firebase user, showing auth screen")
    return <AuthScreen />
  }

  if (!user) {
    console.log("No user document, showing loading spinner")
    return <LoadingSpinner />
  }

  if (!user.householdId) {
    console.log("No household ID, showing household setup")
    return <HouseholdSetup />
  }

  console.log("User authenticated and has household, showing dashboard")
  return <Dashboard />
}
