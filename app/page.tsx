"use client"

import { HouseholdGate } from "@/components/household-gate"
import { Dashboard } from "@/components/dashboard"

export default function Home() {
  return (
    <HouseholdGate>
      <Dashboard />
    </HouseholdGate>
  )
}
