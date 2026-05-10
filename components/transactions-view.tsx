"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  updateDoc,
  deleteDoc,
  where,
  type QueryDocumentSnapshot,
  type DocumentData,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/components/auth-provider"
import { Header } from "@/components/header"
import { TransactionFeed } from "@/components/transaction-feed"
import { CategorySubcategoryFields } from "@/components/category-subcategory-fields"
import { useExpenseCategories } from "@/lib/hooks/use-expense-categories"
import {
  getTransactionHistoryStartIso,
  endOfDayIso,
  startOfMonthIso,
  endOfMonthIso,
} from "@/lib/transaction-history"
import type { Transaction } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

/** Base page size for household + date query (single composite index). */
const PAGE_SIZE = 50
/** Larger batches when narrowing by category/member client-side (same Firestore query). */
const PAGE_SIZE_WITH_META_HINT = 120

function maxIso(a: string, b: string): string {
  return new Date(a) >= new Date(b) ? a : b
}

function minIso(a: string, b: string): string {
  return new Date(a) <= new Date(b) ? a : b
}

export function TransactionsView() {
  const { user } = useAuth()
  const { toast } = useToast()
  const {
    categories,
    subcategoriesByCategory,
    loading: categoriesLoading,
    error: categoriesError,
  } = useExpenseCategories(user?.householdId)

  const [members, setMembers] = useState<{ id: string; name: string }[]>([])

  const [filterCategory, setFilterCategory] = useState("")
  const [filterSubcategory, setFilterSubcategory] = useState("")
  const [filterUserId, setFilterUserId] = useState("")
  const [filterDateFrom, setFilterDateFrom] = useState("")
  const [filterDateTo, setFilterDateTo] = useState("")
  const [filterMonth, setFilterMonth] = useState("")
  const [filterYear, setFilterYear] = useState("")

  const [amountMin, setAmountMin] = useState("")
  const [amountMax, setAmountMax] = useState("")
  const [noteSearch, setNoteSearch] = useState("")

  const [rawRows, setRawRows] = useState<Transaction[]>([])
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [loadingInitial, setLoadingInitial] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [editAmount, setEditAmount] = useState("")
  const [editNote, setEditNote] = useState("")
  const [editCategoryId, setEditCategoryId] = useState("")
  const [editSubcategoryId, setEditSubcategoryId] = useState("")

  const historyStartIso = useMemo(() => getTransactionHistoryStartIso(), [])
  const nowEndIso = useMemo(() => endOfDayIso(new Date()), [])

  const monthOptions = useMemo(() => {
    const out: { value: string; label: string }[] = []
    const start = new Date(historyStartIso)
    const end = new Date()
    let y = start.getFullYear()
    let m = start.getMonth()
    const endY = end.getFullYear()
    const endM = end.getMonth()
    while (y < endY || (y === endY && m <= endM)) {
      const d = new Date(y, m, 1)
      out.push({
        value: d.toISOString().slice(0, 7),
        label: d.toLocaleString("default", { month: "long", year: "numeric" }),
      })
      m++
      if (m > 11) {
        m = 0
        y++
      }
    }
    return out.reverse()
  }, [historyStartIso])

  const yearOptions = useMemo(() => {
    const years = new Set<number>()
    const start = new Date(historyStartIso).getFullYear()
    const end = new Date().getFullYear()
    for (let y = start; y <= end; y++) years.add(y)
    return [...years].sort((a, b) => b - a)
  }, [historyStartIso])

  useEffect(() => {
    if (!user?.householdId) return
    ;(async () => {
      const householdDoc = await getDoc(doc(db, "households", user.householdId!))
      if (!householdDoc.exists()) return
      const memberIds: string[] = householdDoc.data().members || []
      const details = await Promise.all(
        memberIds.map(async (id) => {
          const u = await getDoc(doc(db, "users", id))
          const data = u.data()
          return { id, name: data?.name || "Unknown" }
        })
      )
      setMembers(details)
    })()
  }, [user?.householdId])

  const effectiveRange = useMemo(() => {
    let from = historyStartIso
    let to = nowEndIso

    if (filterDateFrom) {
      const d = new Date(filterDateFrom + "T00:00:00")
      from = maxIso(from, d.toISOString())
    }
    if (filterDateTo) {
      const d = new Date(filterDateTo + "T23:59:59.999")
      to = minIso(to, d.toISOString())
    }

    if (!filterDateFrom && !filterDateTo && filterMonth) {
      const [y, mo] = filterMonth.split("-").map(Number)
      from = maxIso(from, startOfMonthIso(y, mo - 1))
      to = minIso(to, endOfMonthIso(y, mo - 1))
    }

    if (!filterDateFrom && !filterDateTo && !filterMonth && filterYear) {
      const y = Number(filterYear)
      from = maxIso(from, startOfMonthIso(y, 0))
      to = minIso(to, endOfMonthIso(y, 11))
    }

    if (new Date(from) > new Date(to)) {
      return { fromIso: historyStartIso, toIso: nowEndIso }
    }
    return { fromIso: from, toIso: to }
  }, [
    historyStartIso,
    nowEndIso,
    filterDateFrom,
    filterDateTo,
    filterMonth,
    filterYear,
  ])

  /** Only household + date range trigger a refetch. Category/member filters are applied client-side so we do not require extra Firestore composite indexes. */
  const listQueryKey = useMemo(
    () =>
      JSON.stringify({
        from: effectiveRange.fromIso,
        to: effectiveRange.toIso,
        hid: user?.householdId ?? "",
      }),
    [effectiveRange.fromIso, effectiveRange.toIso, user?.householdId]
  )

  const hasMetaLineFilter = !!(filterCategory || filterSubcategory || filterUserId)
  const pageLimit = hasMetaLineFilter ? PAGE_SIZE_WITH_META_HINT : PAGE_SIZE

  const fetchPage = useCallback(
    async (cursor: QueryDocumentSnapshot<DocumentData> | null, append: boolean) => {
      if (!user?.householdId) return

      const hid = user.householdId
      const qConstraints = [
        where("householdId", "==", hid),
        where("timestamp", ">=", effectiveRange.fromIso),
        where("timestamp", "<=", effectiveRange.toIso),
        orderBy("timestamp", "desc"),
        limit(pageLimit),
      ]

      const q = cursor
        ? query(collection(db, "transactions"), ...qConstraints, startAfter(cursor))
        : query(collection(db, "transactions"), ...qConstraints)

      try {
        const snap = await getDocs(q)
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Transaction))
        const nextCursor =
          snap.docs.length > 0 ? snap.docs[snap.docs.length - 1]! : null
        const more = snap.docs.length === pageLimit

        if (append) {
          setRawRows((prev) => {
            const seen = new Set(prev.map((r) => r.id))
            const merged = [...prev]
            for (const r of rows) {
              if (!seen.has(r.id)) {
                seen.add(r.id)
                merged.push(r)
              }
            }
            return merged
          })
        } else {
          setRawRows(rows)
        }
        setLastDoc(more ? nextCursor : null)
        setHasMore(more)
      } catch (e) {
        console.error("[TransactionsView] fetchPage failed:", e)
        toast({
          title: "Could not load transactions",
          description: e instanceof Error ? e.message : "Firestore query failed",
          variant: "destructive",
        })
        if (!append) {
          setRawRows([])
        }
        setLastDoc(null)
        setHasMore(false)
      }
    },
    [user?.householdId, effectiveRange.fromIso, effectiveRange.toIso, pageLimit, toast]
  )

  useEffect(() => {
    if (!user?.householdId) {
      setLoadingInitial(false)
      return
    }
    let cancelled = false
    setLoadingInitial(true)
    setRawRows([])
    setLastDoc(null)
    setHasMore(true)
    fetchPage(null, false).finally(() => {
      if (!cancelled) setLoadingInitial(false)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- listQueryKey drives server fetch
  }, [user?.householdId, listQueryKey, fetchPage])

  const clientFiltered = useMemo(() => {
    const minA = amountMin === "" ? null : Number(amountMin)
    const maxA = amountMax === "" ? null : Number(amountMax)
    const noteQ = noteSearch.trim().toLowerCase()

    return rawRows.filter((t) => {
      if (filterCategory && (t.categoryId ?? "") !== filterCategory) return false
      if (filterSubcategory && (t.subcategoryId ?? "") !== filterSubcategory) return false
      if (filterUserId && (t.userId ?? "") !== filterUserId) return false
      if (minA !== null && !Number.isNaN(minA) && t.amount < minA) return false
      if (maxA !== null && !Number.isNaN(maxA) && t.amount > maxA) return false
      if (noteQ && !(t.note || "").toLowerCase().includes(noteQ)) return false
      return true
    })
  }, [
    rawRows,
    filterCategory,
    filterSubcategory,
    filterUserId,
    amountMin,
    amountMax,
    noteSearch,
  ])

  const loadMore = async () => {
    if (!lastDoc || loadingMore || loadingInitial) return
    setLoadingMore(true)
    try {
      await fetchPage(lastDoc, true)
    } catch (e: unknown) {
      console.error(e)
      toast({
        title: "Could not load more",
        description: e instanceof Error ? e.message : "Try again",
        variant: "destructive",
      })
    } finally {
      setLoadingMore(false)
    }
  }

  const handleEdit = (t: Transaction) => {
    setEditingTransaction(t)
    setEditAmount(t.amount.toFixed(2))
    setEditNote(t.note || "")
    setEditCategoryId(t.categoryId || "")
    setEditSubcategoryId(t.subcategoryId || "")
  }

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!window.confirm("Are you sure you want to delete this transaction?")) return
    try {
      await deleteDoc(doc(db, "transactions", transactionId))
      setRawRows((prev) => prev.filter((r) => r.id !== transactionId))
      toast({
        title: "Transaction deleted",
        description: "The transaction has been removed.",
      })
    } catch (e: unknown) {
      toast({
        title: "Error deleting transaction",
        description: e instanceof Error ? e.message : "Error",
        variant: "destructive",
      })
    }
  }

  const handleSaveEdit = async () => {
    if (!editingTransaction) return
    try {
      const cat = editCategoryId ? categories.find((c) => c.id === editCategoryId) : undefined
      const subs = editCategoryId ? subcategoriesByCategory.get(editCategoryId) ?? [] : []
      const sub = editSubcategoryId ? subs.find((s) => s.id === editSubcategoryId) : undefined

      const patch: Record<string, unknown> = {
        amount: Number.parseFloat(editAmount),
        note: editNote.trim() || null,
      }
      if (editCategoryId && cat) {
        patch.categoryId = editCategoryId
        patch.categoryName = cat.name
        if (editSubcategoryId && sub) {
          patch.subcategoryId = editSubcategoryId
          patch.subcategoryName = sub.name
        } else {
          patch.subcategoryId = null
          patch.subcategoryName = null
        }
      } else {
        patch.categoryId = null
        patch.categoryName = null
        patch.subcategoryId = null
        patch.subcategoryName = null
      }

      await updateDoc(doc(db, "transactions", editingTransaction.id), patch)
      setRawRows((prev) =>
        prev.map((r) =>
          r.id === editingTransaction.id ? { ...r, ...(patch as Partial<Transaction>) } : r
        )
      )
      toast({ title: "Saved", description: "Transaction updated." })
      setEditingTransaction(null)
    } catch (e: unknown) {
      toast({
        title: "Update failed",
        description: e instanceof Error ? e.message : "Error",
        variant: "destructive",
      })
    }
  }

  const clearFilters = () => {
    setFilterCategory("")
    setFilterSubcategory("")
    setFilterUserId("")
    setFilterDateFrom("")
    setFilterDateTo("")
    setFilterMonth("")
    setFilterYear("")
    setAmountMin("")
    setAmountMax("")
    setNoteSearch("")
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Header>
        <h1 className="text-lg sm:text-xl font-bold">Transactions</h1>
      </Header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4">
        <p className="text-sm text-muted-foreground">
          Showing expenses from the last 17 months (household scope). Category, subcategory, and member
          filters apply to the transactions already loaded below — if a filter hides everything, use
          &quot;Load more&quot; to pull older rows from the same date range. Amount and note filters work
          the same way.
        </p>

        <div className="rounded-lg border bg-card p-4 space-y-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold">Filters</h2>
            <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
              Clear all
            </Button>
          </div>

          {categoriesError && (
            <Alert variant="destructive">
              <AlertTitle>Category filters unavailable</AlertTitle>
              <AlertDescription className="text-sm">{categoriesError}</AlertDescription>
            </Alert>
          )}
          {categoriesLoading && !categoriesError && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading category list…
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={filterCategory || "__all__"}
                onValueChange={(v) => {
                  setFilterCategory(v === "__all__" ? "" : v)
                  setFilterSubcategory("")
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Subcategory</Label>
              <Select
                value={filterSubcategory || "__all__"}
                onValueChange={(v) => setFilterSubcategory(v === "__all__" ? "" : v)}
                disabled={!filterCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All subcategories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All in category</SelectItem>
                  {(filterCategory ? subcategoriesByCategory.get(filterCategory) ?? [] : []).map(
                    (s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Member</Label>
              <Select
                value={filterUserId || "__all__"}
                onValueChange={(v) => setFilterUserId(v === "__all__" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Everyone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Everyone</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tx-from">From date</Label>
              <Input
                id="tx-from"
                type="date"
                value={filterDateFrom}
                onChange={(e) => {
                  setFilterDateFrom(e.target.value)
                  setFilterMonth("")
                  setFilterYear("")
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tx-to">To date</Label>
              <Input
                id="tx-to"
                type="date"
                value={filterDateTo}
                onChange={(e) => {
                  setFilterDateTo(e.target.value)
                  setFilterMonth("")
                  setFilterYear("")
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Month</Label>
              <Select
                value={filterMonth || "__none__"}
                onValueChange={(v) => {
                  if (v === "__none__") {
                    setFilterMonth("")
                  } else {
                    setFilterMonth(v)
                    setFilterDateFrom("")
                    setFilterDateTo("")
                    setFilterYear("")
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any month" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="__none__">Any month</SelectItem>
                  {monthOptions.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Year</Label>
              <Select
                value={filterYear || "__none__"}
                onValueChange={(v) => {
                  if (v === "__none__") setFilterYear("")
                  else {
                    setFilterYear(v)
                    setFilterDateFrom("")
                    setFilterDateTo("")
                    setFilterMonth("")
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Any year</SelectItem>
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amt-min">Min amount</Label>
              <Input
                id="amt-min"
                type="number"
                step="0.01"
                placeholder="0"
                value={amountMin}
                onChange={(e) => setAmountMin(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amt-max">Max amount</Label>
              <Input
                id="amt-max"
                type="number"
                step="0.01"
                placeholder="Any"
                value={amountMax}
                onChange={(e) => setAmountMax(e.target.value)}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="note-q">Note contains</Label>
              <Input
                id="note-q"
                placeholder="Search text in notes"
                value={noteSearch}
                onChange={(e) => setNoteSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {!loadingInitial &&
          clientFiltered.length === 0 &&
          rawRows.length > 0 &&
          (filterCategory ||
            filterSubcategory ||
            filterUserId ||
            amountMin ||
            amountMax ||
            noteSearch) && (
            <Alert>
              <AlertTitle>No matches in loaded data</AlertTitle>
              <AlertDescription>
                {rawRows.length} transaction(s) loaded, but none match the current filters. Try{" "}
                &quot;Load more&quot; to fetch older rows, or relax filters / widen the date range.
              </AlertDescription>
            </Alert>
          )}

        <TransactionFeed
          transactions={clientFiltered}
          loading={loadingInitial}
          onEdit={handleEdit}
          onDelete={handleDeleteTransaction}
          title="All matching transactions"
          showMember
        />

        {!loadingInitial && hasMore && (
          <div className="flex justify-center">
            <Button type="button" variant="outline" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading…
                </>
              ) : (
                "Load more"
              )}
            </Button>
          </div>
        )}

        {editingTransaction && (
          <AlertDialog
            open={!!editingTransaction}
            onOpenChange={(o) => !o && setEditingTransaction(null)}
          >
            <AlertDialogContent className="max-h-[90vh] overflow-y-auto">
              <AlertDialogHeader>
                <AlertDialogTitle>Edit transaction</AlertDialogTitle>
                <AlertDialogDescription>
                  Update fields and save. Only admins can edit from the dashboard or here.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="tv-edit-amt">Amount ($)</Label>
                  <Input
                    id="tv-edit-amt"
                    type="number"
                    step="0.01"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="tv-edit-note">Note</Label>
                  <Input
                    id="tv-edit-note"
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                  />
                </div>
                <CategorySubcategoryFields
                  categories={categories}
                  subcategoriesForCategory={
                    editCategoryId ? subcategoriesByCategory.get(editCategoryId) ?? [] : []
                  }
                  categoryId={editCategoryId}
                  subcategoryId={editSubcategoryId}
                  onCategoryChange={setEditCategoryId}
                  onSubcategoryChange={setEditSubcategoryId}
                  idPrefix="tv-edit"
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleSaveEdit}>Save</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </main>
    </div>
  )
}
