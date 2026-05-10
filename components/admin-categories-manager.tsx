"use client"

import { useState } from "react"
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/components/auth-provider"
import { useExpenseCategories } from "@/lib/hooks/use-expense-categories"
import { categoryNameKey } from "@/lib/category-utils"
import type { ExpenseCategory, ExpenseSubcategory } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Pencil, Trash2 } from "lucide-react"

export function AdminCategoriesManager() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { categories, subcategories, subcategoriesByCategory } = useExpenseCategories(
    user?.householdId
  )

  const [newCategoryName, setNewCategoryName] = useState("")
  const [newSubName, setNewSubName] = useState("")
  const [selectedCategoryId, setSelectedCategoryId] = useState("")

  const [editingCat, setEditingCat] = useState<ExpenseCategory | null>(null)
  const [editCatName, setEditCatName] = useState("")
  const [editingSub, setEditingSub] = useState<ExpenseSubcategory | null>(null)
  const [editSubName, setEditSubName] = useState("")

  const householdId = user?.householdId

  const addCategory = async () => {
    if (!householdId) return
    const name = newCategoryName.trim()
    if (!name) {
      toast({ title: "Name required", variant: "destructive" })
      return
    }
    const key = categoryNameKey(name)
    if (categories.some((c) => c.nameKey === key)) {
      toast({
        title: "Duplicate category",
        description: "A category with this name already exists.",
        variant: "destructive",
      })
      return
    }
    try {
      await addDoc(collection(db, "categories"), {
        householdId,
        name,
        nameKey: key,
        createdAt: new Date().toISOString(),
      })
      setNewCategoryName("")
      toast({ title: "Category created" })
    } catch (e: unknown) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Could not create",
        variant: "destructive",
      })
    }
  }

  const saveEditCategory = async () => {
    if (!editingCat) return
    const name = editCatName.trim()
    if (!name) {
      toast({ title: "Name required", variant: "destructive" })
      return
    }
    const key = categoryNameKey(name)
    if (categories.some((c) => c.id !== editingCat.id && c.nameKey === key)) {
      toast({ title: "Duplicate name", variant: "destructive" })
      return
    }
    try {
      await updateDoc(doc(db, "categories", editingCat.id), {
        name,
        nameKey: key,
      })
      setEditingCat(null)
      toast({ title: "Category updated" })
    } catch (e: unknown) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Update failed",
        variant: "destructive",
      })
    }
  }

  const deleteCategory = async (c: ExpenseCategory) => {
    if (!confirm(`Delete category "${c.name}" and all its subcategories?`)) return
    try {
      const subsQ = query(
        collection(db, "subcategories"),
        where("householdId", "==", c.householdId),
        where("categoryId", "==", c.id)
      )
      const subsSnap = await getDocs(subsQ)
      await Promise.all(subsSnap.docs.map((d) => deleteDoc(d.ref)))
      await deleteDoc(doc(db, "categories", c.id))
      if (selectedCategoryId === c.id) setSelectedCategoryId("")
      toast({ title: "Category deleted" })
    } catch (e: unknown) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Delete failed",
        variant: "destructive",
      })
    }
  }

  const addSubcategory = async () => {
    if (!householdId || !selectedCategoryId) {
      toast({ title: "Select a category first", variant: "destructive" })
      return
    }
    const name = newSubName.trim()
    if (!name) {
      toast({ title: "Name required", variant: "destructive" })
      return
    }
    const key = categoryNameKey(name)
    const existing = subcategoriesByCategory.get(selectedCategoryId) ?? []
    if (existing.some((s) => s.nameKey === key)) {
      toast({
        title: "Duplicate subcategory",
        description: "This subcategory already exists under the category.",
        variant: "destructive",
      })
      return
    }
    try {
      await addDoc(collection(db, "subcategories"), {
        householdId,
        categoryId: selectedCategoryId,
        name,
        nameKey: key,
        createdAt: new Date().toISOString(),
      })
      setNewSubName("")
      toast({ title: "Subcategory created" })
    } catch (e: unknown) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Could not create",
        variant: "destructive",
      })
    }
  }

  const saveEditSub = async () => {
    if (!editingSub) return
    const name = editSubName.trim()
    if (!name) {
      toast({ title: "Name required", variant: "destructive" })
      return
    }
    const key = categoryNameKey(name)
    const siblings = subcategories.filter(
      (s) => s.categoryId === editingSub.categoryId && s.id !== editingSub.id
    )
    if (siblings.some((s) => s.nameKey === key)) {
      toast({ title: "Duplicate name", variant: "destructive" })
      return
    }
    try {
      await updateDoc(doc(db, "subcategories", editingSub.id), {
        name,
        nameKey: key,
      })
      setEditingSub(null)
      toast({ title: "Subcategory updated" })
    } catch (e: unknown) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Update failed",
        variant: "destructive",
      })
    }
  }

  const deleteSub = async (s: ExpenseSubcategory) => {
    if (!confirm(`Delete subcategory "${s.name}"?`)) return
    try {
      await deleteDoc(doc(db, "subcategories", s.id))
      toast({ title: "Subcategory deleted" })
    } catch (e: unknown) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Delete failed",
        variant: "destructive",
      })
    }
  }

  const subsForSelected = selectedCategoryId
    ? subcategoriesByCategory.get(selectedCategoryId) ?? []
    : []

  return (
    <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
          <CardDescription>
            Top-level expense categories for your household. Names must be unique (case-insensitive).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="New category name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="flex-1"
            />
            <Button type="button" onClick={addCategory}>
              Add category
            </Button>
          </div>
          <ul className="space-y-2 divide-y rounded-md border">
            {categories.length === 0 && (
              <li className="p-4 text-sm text-muted-foreground">No categories yet.</li>
            )}
            {categories.map((c) => (
              <li
                key={c.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3"
              >
                {editingCat?.id === c.id ? (
                  <div className="flex flex-1 flex-col sm:flex-row gap-2">
                    <Input
                      value={editCatName}
                      onChange={(e) => setEditCatName(e.target.value)}
                      className="flex-1"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" type="button" onClick={saveEditCategory}>
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        type="button"
                        onClick={() => setEditingCat(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <span className="font-medium">{c.name}</span>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingCat(c)
                          setEditCatName(c.name)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-destructive"
                        onClick={() => deleteCategory(c)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subcategories</CardTitle>
          <CardDescription>
            Subcategories belong to one category. Pick a category, then add or manage sub-items.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Parent category</Label>
            <Select
              value={selectedCategoryId || "__none__"}
              onValueChange={(v) => setSelectedCategoryId(v === "__none__" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Select…</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="New subcategory name"
              value={newSubName}
              onChange={(e) => setNewSubName(e.target.value)}
              disabled={!selectedCategoryId}
              className="flex-1"
            />
            <Button type="button" onClick={addSubcategory} disabled={!selectedCategoryId}>
              Add subcategory
            </Button>
          </div>

          <ul className="space-y-2 divide-y rounded-md border">
            {!selectedCategoryId && (
              <li className="p-4 text-sm text-muted-foreground">
                Select a category to list subcategories.
              </li>
            )}
            {selectedCategoryId && subsForSelected.length === 0 && (
              <li className="p-4 text-sm text-muted-foreground">No subcategories yet.</li>
            )}
            {subsForSelected.map((s) => (
              <li
                key={s.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3"
              >
                {editingSub?.id === s.id ? (
                  <div className="flex flex-1 flex-col sm:flex-row gap-2">
                    <Input
                      value={editSubName}
                      onChange={(e) => setEditSubName(e.target.value)}
                      className="flex-1"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" type="button" onClick={saveEditSub}>
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        type="button"
                        onClick={() => setEditingSub(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <span className="font-medium">{s.name}</span>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingSub(s)
                          setEditSubName(s.name)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-destructive"
                        onClick={() => deleteSub(s)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </main>
  )
}
