"use client"

import { useEffect, useMemo, useState } from "react"
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { ExpenseCategory, ExpenseSubcategory } from "@/types"

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
      return
    }

    setLoading(true)
    setError(null)

    const catQ = query(
      collection(db, "categories"),
      where("householdId", "==", householdId),
      orderBy("name")
    )
    const subQ = query(
      collection(db, "subcategories"),
      where("householdId", "==", householdId),
      orderBy("name")
    )

    const unsubCat = onSnapshot(
      catQ,
      (snap) => {
        setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ExpenseCategory)))
        setLoading(false)
      },
      (e) => {
        console.error(e)
        setError("Could not load categories")
        setLoading(false)
      }
    )
    const unsubSub = onSnapshot(
      subQ,
      (snap) => {
        setSubcategories(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ExpenseSubcategory)))
      },
      (e) => console.error(e)
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
      arr.sort((a, b) => a.name.localeCompare(b.name))
    }
    return m
  }, [subcategories])

  return { categories, subcategories, subcategoriesByCategory, loading, error }
}
