"use client"

import { useEffect, useMemo, useState } from "react"
import { collection, onSnapshot, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { ExpenseCategory, ExpenseSubcategory } from "@/types"

function sortByName<T extends { name: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }))
}

/**
 * Loads categories/subcategories for a household.
 *
 * Important: We intentionally avoid `orderBy("name")` in Firestore. A compound query
 * `where("householdId") + orderBy("name")` requires a composite index; if that index
 * is not deployed, listeners fail after a full page reload while local writes can still
 * appear briefly. Single-field `householdId` equality uses the automatic index; we sort
 * in memory instead.
 */
export function useExpenseCategories(householdId: string | undefined) {
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [subcategories, setSubcategories] = useState<ExpenseSubcategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!householdId) {
      setCategories([])
      setSubcategories([])
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    const catQ = query(collection(db, "categories"), where("householdId", "==", householdId))
    const subQ = query(collection(db, "subcategories"), where("householdId", "==", householdId))

    const unsubCat = onSnapshot(
      catQ,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ExpenseCategory))
        setCategories(sortByName(rows))
        setLoading(false)
      },
      (e) => {
        console.error("[useExpenseCategories] categories snapshot failed:", e)
        setError(
          e instanceof Error
            ? `${e.message}${"code" in e ? ` (${(e as { code?: string }).code})` : ""}`
            : "Could not load categories"
        )
        setCategories([])
        setLoading(false)
      }
    )
    const unsubSub = onSnapshot(
      subQ,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ExpenseSubcategory))
        setSubcategories(sortByName(rows))
      },
      (e) => {
        console.error("[useExpenseCategories] subcategories snapshot failed:", e)
        setError((prev) => {
          const msg =
            e instanceof Error
              ? `${e.message}${"code" in e ? ` (${(e as { code?: string }).code})` : ""}`
              : "Could not load subcategories"
          return prev ? `${prev}; ${msg}` : msg
        })
        setSubcategories([])
        setLoading(false)
      }
    )

    return () => {
      unsubCat()
      unsubSub()
    }
  }, [householdId])

  const subcategoriesByCategory = useMemo(() => {
    const m = new Map<string, ExpenseSubcategory[]>()
    for (const s of subcategories) {
      if (!m.has(s.categoryId)) m.set(s.categoryId, [])
      m.get(s.categoryId)!.push(s)
    }
    for (const arr of m.values()) {
      arr.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }))
    }
    return m
  }, [subcategories])

  return { categories, subcategories, subcategoriesByCategory, loading, error }
}
